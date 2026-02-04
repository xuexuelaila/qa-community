import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

// 获取用户信息
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 创建用户
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nickname, avatar, role, wechatId } = req.body;

    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: 'Nickname is required',
      });
    }

    const user = new User({
      nickname,
      avatar: avatar || '',
      role: role || 'member',
      wechatId,
      stats: {
        questionsCount: 0,
        answersCount: 0,
        adoptedCount: 0,
      },
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 搜索用户（用于@提醒）
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required',
      });
    }

    const users = await User.find({
      nickname: { $regex: keyword as string, $options: 'i' },
    })
      .select('nickname avatar role')
      .limit(10);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
