CREATE TABLE `storeSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeName` text NOT NULL,
	`address` text NOT NULL,
	`city` varchar(255) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zipCode` varchar(10) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`hours` text NOT NULL,
	`pickupInstructions` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeSettings_id` PRIMARY KEY(`id`)
);
