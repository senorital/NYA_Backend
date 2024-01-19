const db = require('../../Models');
const Quiz = db.quiz;
const { createQuiz } = require("../../Middlewares/Validate/validateUser");
const { deleteSingleFile } = require('../../Util/deleteFile');
const { Op } = require('sequelize');

// createQuiz
// getQuizForCreater
// getQuizForAdmin
// getQuizForUser
// getQuizById
// approveQuizCreation
// disApproveQuizCreation
// updateQuiz
// approveQuizUpdation
// disApproveQuizUpdation

exports.createQuiz = async (req, res) => {
    try {
        //File
        if (!req.file) {
            return res.status(400).send({
                success: false,
                message: "Select a Image!"
            });
        }
        // Validate Body
        const { error } = createQuiz(req.body);
        if (error) {
            deleteSingleFile(req.file.path);
            return res.status(400).send(error.details[0].message);
        }
        const create = req.instructor ? req.instructor : req.institute;
        const createrId = create.id;
        const { quizName, details, question, points, option, answer } = req.body;
        // Create Quiz in database
        await Quiz.create({
            quizName: quizName,
            details: details,
            question: question,
            points: points,
            option: option,
            answer: answer,
            imagePath: req.file.path,
            imageName: req.file.originalname,
            imageFileName: req.file.filename,
            createrId: createrId
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Quiz Created successfully. Wait for NYA Approval!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getQuizForCreater = async (req, res) => {
    try {
        const create = req.instructor ? req.instructor : req.institute;
        const createrId = create.id;
        const { page, limit, search } = req.query;
        // Pagination
        const recordLimit = parseInt(limit) || 10;
        let offSet = 0;
        let currentPage = 1;
        if (page) {
            offSet = (parseInt(page) - 1) * recordLimit;
            currentPage = parseInt(page);
        }
        // Search 
        const condition = [{ createrId: createrId }];
        if (search) {
            condition.push({
                [Op.or]: [
                    { quizName: { [Op.substring]: search } },
                    { answer: { [Op.substring]: search } },
                    { question: { [Op.substring]: search } },
                    { points: { [Op.substring]: search } }
                ]
            })
        }
        // Count All Quiz
        const totalQuiz = await Quiz.count({
            where: {
                [Op.and]: condition
            },
            paranoid: false
        });
        const quiz = await Quiz.findAll({
            limit: recordLimit,
            offset: offSet,
            where: {
                [Op.and]: condition
            },
            paranoid: false,
            order: [
                ['createdAt', 'DESC']
            ]
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Quiz fetched successfully!',
            totalPage: Math.ceil(totalQuiz / recordLimit),
            currentPage: currentPage,
            data: quiz
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getQuizForAdmin = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        // Pagination
        const recordLimit = parseInt(limit) || 10;
        let offSet = 0;
        let currentPage = 1;
        if (page) {
            offSet = (parseInt(page) - 1) * recordLimit;
            currentPage = parseInt(page);
        }
        // Search 
        const condition = [];
        if (search) {
            condition.push({
                [Op.or]: [
                    { quizName: { [Op.substring]: search } },
                    { answer: { [Op.substring]: search } },
                    { question: { [Op.substring]: search } },
                    { points: { [Op.substring]: search } }
                ]
            })
        }
        // Count All Quiz
        const totalQuiz = await Quiz.count({
            where: {
                [Op.and]: condition
            },
            paranoid: false
        });
        const quiz = await Quiz.findAll({
            limit: recordLimit,
            offset: offSet,
            where: {
                [Op.and]: condition
            },
            paranoid: false,
            order: [
                ['createdAt', 'DESC']
            ]
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Quiz fetched successfully!',
            totalPage: Math.ceil(totalQuiz / recordLimit),
            currentPage: currentPage,
            data: quiz
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getQuizForUser = async (req, res) => {
    try {
        const createrId = req.body.createrId;
        if (!createrId) {
            return res.status(400).send({
                success: false,
                message: "Instructor or institute id should be present!"
            });
        }
        const { page, limit } = req.query;
        // Pagination
        const recordLimit = parseInt(limit) || 10;
        let offSet = 0;
        let currentPage = 1;
        if (page) {
            offSet = (parseInt(page) - 1) * recordLimit;
            currentPage = parseInt(page);
        }
        // Search 
        const condition = [{ approvedByAdmin: true },
        { createrId: createrId }];
        // Count All Quiz
        const totalQuiz = await Quiz.count({
            where: {
                [Op.and]: condition
            }
        });
        const quiz = await Quiz.findAll({
            limit: recordLimit,
            offset: offSet,
            where: {
                [Op.and]: condition
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Quiz fetched successfully!',
            totalPage: Math.ceil(totalQuiz / recordLimit),
            currentPage: currentPage,
            data: quiz
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getQuizById = async (req, res) => {
    try {
        let argument = {
            where: {
                id: req.params.id
            },
            paranoid: false
        }
        if (req.user) {
            argument = {
                where: {
                    id: req.params.id,
                    approvedByAdmin: true
                }
            }
        }
        const quiz = await Quiz.findOne(argument);
        if (!quiz) {
            return res.status(400).send({
                success: false,
                message: "Such quiz is not present!"
            });
        }
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Quiz fetched successfully!',
            data: quiz
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.approveQuizCreation = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!quiz) {
            return res.status(400).send({
                success: false,
                message: "Such quiz is not present!"
            });
        }
        // Approve
        await quiz.update({
            ...quiz,
            approvedByAdmin: true
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Quiz approved successfully!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.disApproveQuizCreation = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!quiz) {
            return res.status(400).send({
                success: false,
                message: "Such quiz is not present!"
            });
        }
        // DisApprove
        await quiz.update({
            ...quiz,
            approvedByAdmin: false
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Quiz disApproved successfully!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};