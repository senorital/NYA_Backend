const db = require('../../Models');
const Event = db.event;
const EventUpdation = db.eventUpdation;
const { createEvent } = require("../../Middlewares/Validate/validateUser");
const { deleteSingleFile } = require('../../Util/deleteFile');
const { Op } = require('sequelize');

// createEvent
// getEventForCreater
// getEventForAdmin
// getEventForUser
// getEventById
// approveEventCreation
// disApproveEventCreation
// updateEvent
// approveEventUpdation
// disApproveEventUpdation

exports.createEvent = async (req, res) => {
    try {
        //File
        if (!req.file) {
            return res.status(400).send({
                success: false,
                message: "Select a Image!"
            });
        }
        // Validate Body
        const { error } = createEvent(req.body);
        if (error) {
            deleteSingleFile(req.file.path);
            return res.status(400).send(error.details[0].message);
        }
        const create = req.instructor ? req.instructor : req.institute;
        const createrId = create.id;
        const { date_time, eventName, location, aboutEvent } = req.body;
        // Create event in database
        await Event.create({
            date_time: date_time,
            eventName: eventName,
            location: location,
            aboutEvent: aboutEvent,
            imagePath: req.file.path,
            imageName: req.file.originalname,
            imageFileName: req.file.filename,
            createrId: createrId
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Event Created successfully. Wait for NYA Approval!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getEventForCreater = async (req, res) => {
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
                    { eventName: { [Op.substring]: search } },
                    { date_time: { [Op.substring]: search } },
                    { location: { [Op.substring]: search } }
                ]
            })
        }
        // Count All Event
        const totalEvent = await Event.count({
            where: {
                [Op.and]: condition
            },
            paranoid: false
        });
        const event = await Event.findAll({
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
            message: 'Event fetched successfully!',
            totalPage: Math.ceil(totalEvent / recordLimit),
            currentPage: currentPage,
            data: event
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getEventForAdmin = async (req, res) => {
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
                    { eventName: { [Op.substring]: search } },
                    { date_time: { [Op.substring]: search } },
                    { location: { [Op.substring]: search } }
                ]
            })
        }
        // Count All Event
        const totalEvent = await Event.count({
            where: {
                [Op.and]: condition
            },
            paranoid: false
        });
        const event = await Event.findAll({
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
            message: 'Event fetched successfully!',
            totalPage: Math.ceil(totalEvent / recordLimit),
            currentPage: currentPage,
            data: event
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getEventForUser = async (req, res) => {
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
        const condition = [{ approvedByAdmin: true }];
        if (search) {
            condition.push({
                [Op.or]: [
                    { eventName: { [Op.substring]: search } },
                    { date_time: { [Op.substring]: search } },
                    { location: { [Op.substring]: search } }
                ]
            })
        }
        // Count All Event
        const totalEvent = await Event.count({
            where: {
                [Op.and]: condition
            }
        });
        const event = await Event.findAll({
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
            message: 'Event fetched successfully!',
            totalPage: Math.ceil(totalEvent / recordLimit),
            currentPage: currentPage,
            data: event
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getEventById = async (req, res) => {
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
        const event = await Event.findOne(argument);
        if (!event) {
            return res.status(400).send({
                success: false,
                message: "Such event is not present!"
            });
        }
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Event fetched successfully!',
            data: event
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.approveEventCreation = async (req, res) => {
    try {
        const event = await Event.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!event) {
            return res.status(400).send({
                success: false,
                message: "Such event is not present!"
            });
        }
        // Approve
        await event.update({
            ...event,
            approvedByAdmin: true
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Event approved successfully!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.disApproveEventCreation = async (req, res) => {
    try {
        const event = await Event.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!event) {
            return res.status(400).send({
                success: false,
                message: "Such event is not present!"
            });
        }
        // DisApprove
        await event.update({
            ...event,
            approvedByAdmin: false
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Event disApproved successfully!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        //File
        if (!req.file) {
            return res.status(400).send({
                success: false,
                message: "Select a Image!"
            });
        }
        // Validate Body
        const { error } = createEvent(req.body);
        if (error) {
            deleteSingleFile(req.file.path);
            return res.status(400).send(error.details[0].message);
        }
        const create = req.instructor ? req.instructor : req.institute;
        const createrId = create.id;
        const event = await Event.findOne({
            where: {
                id: req.params.id,
                createrId: createrId
            }
        });
        if (!event) {
            return res.status(400).send({
                success: false,
                message: "Such event is not present!"
            });
        }
        const { date_time, eventName, location, aboutEvent } = req.body;
        // Create event in database
        await EventUpdation.create({
            date_time: date_time,
            eventName: eventName,
            location: location,
            aboutEvent: aboutEvent,
            filePath: req.file.path,
            imageName: req.file.originalname,
            imageFileName: req.file.filename,
            eventId: event.id,
            createrId: createrId
        });
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Event updation request created successfully. Wait for NYA Approval!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.approveEventUpdation = async (req, res) => {
    try {
        const eventUpdation = await EventUpdation.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!eventUpdation) {
            return res.status(400).send({
                success: false,
                message: "Event updation request is not present!"
            });
        }
        // Approve
        const event = await Event.findOne({
            where: {
                id: eventUpdation.eventId
            }
        });
        // Update
        await event.update({
            ...event,
            date_time: eventUpdation.date_time,
            eventName: eventUpdation.eventName,
            location: eventUpdation.location,
            aboutEvent: eventUpdation.aboutEvent,
            filePath: eventUpdation.filePath,
            imageName: eventUpdation.imageName,
            imageFileName: eventUpdation.imageFileName
        });
        // update updation request
        await eventUpdation.update({ where: { approvedByAdmin: true } });
        // Soft delete updation request
        await eventUpdation.destroy();
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Event approved successfully!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.disApproveEventUpdation = async (req, res) => {
    try {
        const eventUpdation = await EventUpdation.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!eventUpdation) {
            return res.status(400).send({
                success: false,
                message: "Event updation request is not present!"
            });
        }
        // update updation request
        await eventUpdation.update({ where: { approvedByAdmin: true } });
        // Soft delete updation request
        await eventUpdation.destroy();
        // Send final success response
        res.status(200).send({
            success: true,
            message: 'Event disApproved successfully!'
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};

exports.getEventUpdationForAdmin = async (req, res) => {
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
                    { eventName: { [Op.substring]: search } },
                    { date_time: { [Op.substring]: search } },
                    { location: { [Op.substring]: search } }
                ]
            })
        }
        // Count All Event
        const totalEvent = await EventUpdation.count({
            where: {
                [Op.and]: condition
            },
            paranoid: false
        });
        const eventUpdation = await EventUpdation.findAll({
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
            message: 'Event fetched successfully!',
            totalPage: Math.ceil(totalEvent / recordLimit),
            currentPage: currentPage,
            data: eventUpdation
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};