const { z } = require("zod");

const registerSchema = z.object({

    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),

    email: z
    .string()
    .email("Invalid email address")
    .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(64, "Password cannot exceed 64 characters")

});


const loginSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(1, "Password is required")
});

module.exports = {
    registerSchema,
    loginSchema
};
