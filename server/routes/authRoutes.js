import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/schemas.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { isValidRollNumber } from '../../shared/validation.js';
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'STUDENT', department, rollNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    let finalRollNumber = rollNumber;
    if (role.toUpperCase() === 'STUDENT') {
      if (!isValidRollNumber(rollNumber)) {
        return res.status(400).json({ success: false, message: 'Invalid roll number format. Format: YY + Dept Code + 3-digit number, e.g. 24AD007.' });
      }
      finalRollNumber = rollNumber.trim().toUpperCase();
      const existingRoll = await User.findOne({ rollNumber: finalRollNumber });
      if (existingRoll) {
        return res.status(409).json({ success: false, message: 'A student with this roll number is already registered.' });
      }
    } else {
      // For non-students, don't store a roll number to avoid unique index conflicts
      finalRollNumber = undefined;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role.toUpperCase(),
      department: department || 'Computer Science & Engineering',
      rollNumber: finalRollNumber,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      streak: 1,
      isActive: true,
      lastLogin: new Date()
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        rollNumber: newUser.rollNumber,
        avatar: newUser.avatar,
        streak: newUser.streak
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id || user.id, { lastLogin: new Date() });

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber,
        avatar: user.avatar,
        streak: user.streak || 3
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get current user session
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber,
        avatar: user.avatar,
        streak: user.streak || 1
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user session.' });
  }
});

// Update profile photo
router.post('/profile/photo', authenticate, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ success: false, message: 'Image data is required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: 'Profile photo updated successfully',
      avatar: updatedUser.avatar
    });
  } catch (err) {
    console.error('Error updating profile photo:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile photo.' });
  }
});

// Update profile details (name, department, classSection)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, department, classSection } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (department !== undefined) updates.department = department.trim();
    if (classSection !== undefined) updates.classSection = classSection.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        classSection: updatedUser.classSection,
        rollNumber: updatedUser.rollNumber,
        avatar: updatedUser.avatar,
        streak: updatedUser.streak
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// Change Password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

// Provide demo accounts list for effortless demo login
router.get('/demo-users', async (req, res) => {
  try {
    const users = await User.find({});
    const sanitized = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      rollNumber: u.rollNumber,
      avatar: u.avatar
    }));
    return res.json({ success: true, users: sanitized });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch demo users.' });
  }
});

export default router;
