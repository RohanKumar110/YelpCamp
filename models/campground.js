const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require("./review");
const opts = { toJSON: { virtuals: true } };

const campgroundSchema = new Schema({
    title: String,
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    images: [
        {
            url: String,
            filename: String
        }
    ],
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ]
}, opts);

campgroundSchema.virtual("properties.popUpMarkup").get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>`;
});

campgroundSchema.post("findOneAndDelete", async function (campground) {
    if (campground.reviews.length) {
        const res = await Review.deleteMany({ _id: { $in: campground.reviews } });
        console.log(res);
    }
});

const Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;