import Menu from "../models/Menu.js";

// CREATE MENU ITEM
export const createMenuItem = async (req, res) => {
    try {
        const { name, price, image, description, category } = req.body;

        const menuItem = await Menu.create({
            name,
            price,
            image,
            description,
            category,
        });

        res.status(201).json({
            success: true,
            message: "Menu item created successfully",
            menuItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// GET ALL MENU ITEMS
export const getMenuItems = async (req, res) => {
    try {
        const menuItems = await Menu.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            menuItems,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// UPDATE MENU ITEM
export const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedItem = await Menu.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully",
            menuItem: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// DELETE MENU ITEM
export const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedItem = await Menu.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// TOGGLE AVAILABILITY
export const toggleAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        const menuItem = await Menu.findById(id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found",
            });
        }

        menuItem.availability = !menuItem.availability;

        await menuItem.save();

        res.status(200).json({
            success: true,
            message: "Availability updated successfully",
            menuItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};