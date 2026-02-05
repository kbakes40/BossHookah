CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255) NOT NULL,
	`stripeCheckoutSessionId` varchar(255),
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`totalAmount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`items` text NOT NULL,
	`shippingAddress` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);