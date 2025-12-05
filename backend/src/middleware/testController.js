const testAuth = async (req, res) => {
  try {
    console.log('🧪 Test Auth - User:', req.user);
    
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        studentId: req.user.studentId,
        teacherId: req.user.teacherId,
        hasStudent: !!req.user.Student,
        hasTeacher: !!req.user.Teacher
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { testAuth };