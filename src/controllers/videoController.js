import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";
export const home = async (req, res) => {
  try {
    const videos = await await Video.find({})
      .sort({ createdAt: "desc" })
      .populate("owner");

    return res.render("home", { pageTitle: "Home", videos });
  } catch (error) {
    return res.send(error);
  }
};
export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id)
    .populate("owner")
    .populate({
      path: "comments",
      populate: {
        path: "owner",
        model: "User",
      },
    });
  if (!video) {
    return res.render("404", { pageTitle: "Video not found." });
  }
  return res.render("watch", {
    pageTitle: video.title,
    video,
  });
};
export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  console.log(video.owner, _id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  return res.render("edit", {
    pageTitle: `Editing: ${video.title} `,
    video,
  });
};
export const postEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const { title, description, hashtags } = req.body;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner._id) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });

  return res.status(200).redirect(`/videos/${id}`);
};
export const getUpload = (req, res) => {
  return res.render("upload", {
    pageTitle: "Upload Video",
  });
};
export const postUpload = async (req, res) => {
  // here we will add  a video to the videos array.
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files;
  console.log(video, thumb);
  const { title, description, hashtags } = req.body;
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: video[0].location,
      thumbUrl: thumb[0].location,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });

    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(404).render("upload", {
      pageTitle: "Upload Videos",
      errorMessage: error._message,
    });
  }
};
export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Not authorized");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  //delete video
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  if (keyword) {
    const videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, "i"),
      },
    }).populate("owner");
    return res.render("search", { pageTitle: "Search", videos });
  }
  return res.render("search", { pageTitle: "Search", videos: [] });
};
export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views += 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    session: { user },
    params: { id },
    body: { text },
  } = req;
  // if video doesn't found, throw error.
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }

  const comment = await Comment.create({
    text,
    owner: user,
    video: id,
  });
  //  after saving comment, we should update video
  video.comments.push(comment._id);
  video.save();
  console.log("comment is created");

  return res.status("201").json({
    newCommentId: comment._id,
    socialOnly: user.socialOnly,
    avatarUrl: user.avatarUrl,
    name: user.name,
  });
};

export const deleteComment = async (req, res) => {
  const { id: commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    req.flash("error", "Comment not found.");
    return res.sendStatus(404);
  }
  if (String(comment.owner) !== req.session.user._id) {
    req.flash("error", "Not authorized");
    return res.sendStatus(404);
  }
  console.log("ok");
  await Comment.findByIdAndDelete(commentId);
  req.flash("Your comment is deleted");
  return res.sendStatus("200");
  // delete part
  // await Comment.findByIdAndDelete(commentId);
};
