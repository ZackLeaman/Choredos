const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const choreSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    lastCompleted: [{ type: Date }],
    nextDue: {
      type: Date,
    },
    dueEvery: {
      type: Number,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    links: [
      {
        display: { type: String, required: true },
        link: { type: String, required: true },
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chore", choreSchema);
