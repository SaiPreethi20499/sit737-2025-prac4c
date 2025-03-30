const express = require("express");
const app = express();
const winston = require("winston");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "calculator-microservice" },
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    );
}

const operations = {
    add: (n1, n2) => n1 + n2,
    sub: (n1, n2) => n1 - n2,
    mul: (n1, n2) => n1 * n2,
    div: (n1, n2) => {
        if (n2 === 0) throw new Error("Cannot divide by zero");
        return n1 / n2;
    },
    exp: (n1, n2) => Math.pow(n1, n2),
    sqrt: (n1) => {
        if (n1 < 0) throw new Error("Cannot compute square root of a negative number");
        return Math.sqrt(n1);
    },
    mod: (n1, n2) => {
        if (n2 === 0) throw new Error("Cannot perform modulo by zero");
        return n1 % n2;
    },
    percentage: (n1, n2) => (n1/100) * n2,
    cbrt: (n1) => {
        if (n1 < 0) throw new Error("Cannot compute cube root of a negative number");
        return Math.cbrt(n1);
    },
};

app.get("/calculate", (req, res, next) => {
    try {
        const { operation, num1, num2 } = req.query;
        const n1 = parseFloat(num1);
        const n2 = num2 !== undefined ? parseFloat(num2) : null;

        if (!operations[operation]) {
            logger.error(`Invalid operation: ${operation}`);
            throw new Error("Invalid operation. Use add, sub, mul, div, exp, sqrt, mod, percentile, or cbrt.");
        }
        if (isNaN(n1) || (num2 !== undefined && isNaN(n2))) {
            logger.error("Invalid number input");
            throw new Error("Both num1 and num2 (if applicable) must be valid numbers.");
        }

        const result = num2 !== undefined ? operations[operation](n1, n2) : operations[operation](n1);
        
        logger.log({
            level: "info",
            message: `Operation: ${operation}, Numbers: ${n1}, ${n2}, Result: ${result}`,
        });
        
        res.status(200).json({ statusCode: 200, operation, num1: n1, num2: n2, result });
    } catch (error) {
        next(error);
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).json({ statusCode: 500, msg: err.message });
});

const port = 3040;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
