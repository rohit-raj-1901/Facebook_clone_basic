const express = require('express');
const router = express.Router();
const User = require('../Models/user');
const Post = require('../Models/post');

// Create a user
router.post('/users', async (req, res) => {
    const { username } = req.body;
  
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
  
      const newUser = new User({ username });
      await newUser.save();
  
      res.status(201).json(newUser);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  

// Create a post
router.post('/posts', async (req, res) => {
  const { userId, content } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = new Post({ content, author: userId });
    await post.save();

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post
router.delete('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post || post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow a user
router.post('/users/:userId/follow', async (req, res) => {
  const { userId } = req.params;
  const { followerId } = req.body;

  try {
    const userToFollow = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!userToFollow || !follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!follower.following.includes(userToFollow._id)) {
      follower.following.push(userToFollow._id);
      await follower.save();
    }

    res.status(200).json({ message: 'User followed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfollow a user
router.post('/users/:userId/unfollow', async (req, res) => {
  const { userId } = req.params;
  const { followerId } = req.body;

  try {
    const userToUnfollow = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!userToUnfollow || !follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    follower.following = follower.following.filter(
      (followingId) => followingId.toString() !== userToUnfollow._id.toString()
    );

    await follower.save();
    res.status(200).json({ message: 'User unfollowed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get news feed (recent posts from followed users)
router.get('/users/:userId/feed', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('following');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: { $in: user.following } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'username');

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
