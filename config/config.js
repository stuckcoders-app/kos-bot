"use strict";

let config = {
	"token": process.env.TOKEN || "",
	"db_url": process.env.DB_URL || "",
	"track_url": process.env.TRACK_URL || "",
	"track_info_url": process.env.TRACK_INFO_URL || ""
}

module.exports = config;