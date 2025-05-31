const playgroundData = require("../playgroundData.json");

exports.getPlaygroundData = (req, res) => {
    try {
        res.status(200).json(playgroundData); // sends the array directly
    } catch (error) {
        console.error("Error sending playground data:", error);
        res.status(500).json({ message: "Error fetching playground data", error });
    }
};
