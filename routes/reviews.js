const { validateReview, isLoggedIn, isReviewAuthor } = require("../utils/middleware");
const catchAsync = require("../utils/catchAsync");
const express = require("express");
const router = express.Router({ mergeParams: true });
const reviews = require("../controllers/reviews");

router.post("/", isLoggedIn, validateReview, catchAsync(reviews.createReview));

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;

