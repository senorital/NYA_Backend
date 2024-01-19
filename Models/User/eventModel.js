module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define("events", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        date_time: {
            type: DataTypes.DATE
        },
        eventName: {
            type: DataTypes.STRING
        },
        location: {
            type: DataTypes.STRING
        },
        aboutEvent: {
            type: DataTypes.STRING(1234)
        },
        imagePath: {
            type: DataTypes.STRING(1234)
        },
        imageName: {
            type: DataTypes.STRING
        },
        imageFileName: {
            type: DataTypes.STRING
        },
        approvedByAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        createrId:{
            type: DataTypes.STRING
        }
    }, {
        paranoid: true
    });
    return Event;
};