"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resizeController_1 = require("../controllers/resizeController");
const router = express_1.default.Router();
router.post('/resize', resizeController_1.resizeHandler);
router.get('/api/resize-image', resizeController_1.apiResizeHandler);
exports.default = router;
