import User from "../models/User";
import bcrypt from "bcrypt";
import { token } from "morgan";
import Video from "../models/Video";

export const getJoin = (req, res) => {
  res.render("join", { pageTitle: "Join" });
};
export const postJoin = async (req, res) => {
  const { email, username, password, password2, name, location } = req.body;
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle: "Password Error",
      errorMessage: "Password confirmation does not match.",
    });
  }
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    res.status(400).render("join", {
      pageTitle: "Username Error",
      errorMessage: "This username is already taken.",
    });
  }
  try {
    await User.create({
      email,
      username,
      password,
      name,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle: "join again",
      errorMessage: error._message,
    });
  }
};
export const getLogin = (req, res) => {
  res.render("login", {
    pageTitle: "Login",
  });
};
export const postLogin = async (req, res) => {
  // check if the account exists
  // checi if password correct
  const { username, password } = req.body;
  const user = await User.findOne({ username, socialOnly: false });
  const pageTitle = "Login";
  if (!user) {
    console.log("user doesn't exist.");
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "An account with this username doesn't exist.",
    });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "Wrong password.",
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = `https://github.com/login/oauth/authorize`;
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();

  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};
export const finishGithubLogin = async (req, res) => {
  try {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
      client_id: process.env.GH_CLIENT,
      client_secret: process.env.GH_SECRET,
      code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (
      await fetch(finalUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      })
    ).json();

    if ("access_token" in tokenRequest) {
      const { access_token } = tokenRequest;
      const apiUrl = "https://api.github.com";
      const userData = await (
        await fetch(`${apiUrl}/user`, {
          headers: {
            Authorization: `token ${access_token}`,
          },
        })
      ).json();
      const emailData = await (
        await fetch(`${apiUrl}/user/emails`, {
          headers: {
            Authorization: `token ${access_token}`,
          },
        })
      ).json();
      const emailObj = emailData.find((email) => {
        return email.primary === true && email.verified === true;
      });
      if (!emailObj) {
        return res.redirect("/login");
      }
      let user = await User.findOne({ email: emailObj.email });
      if (!user) {
        user = await User.create({
          email: emailObj.email,
          avatarUrl: userData.avatar_url,
          socialOnly: true,
          username: userData.login,
          password: "",
          name: userData.name,
          location: userData.location,
        });
      }
      req.session.loggedIn = true;
      req.session.user = user;
      return res.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};

export const getEdit = (req, res) => {
  return res.render("edit-profile", { pageTitle: "Edit Profile" });
};
export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl },
    },
    body: { name, email, username, location },
    file,
  } = req;
  if (username !== req.session.user.username) {
    const sameUsername = await User.findOne({ username });
    if (sameUsername) {
      return res.status(400).render("edit-profile", {
        errorMessage: "Username already existed.",
      });
    }
  }
  if (email !== req.session.user.email) {
    const sameEmail = await User.findOne({ email });
    if (sameEmail) {
      return res.status(400).render("edit-profile", {
        errorMessage: "Email already existed.",
      });
    }
  }
  const updateUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.path : avatarUrl,
      name,
      email,
      username,
      location,
    },
    {
      new: true,
    }
  );
  req.session.user = updateUser;
  e;
  return res.redirect("/users/edit");
};
export const logout = (req, res) => {
  req.session.destroy();
  req.flash("info", "Bye Bye");
  return res.redirect("/");
};
export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User",
    },
  });
  console.log(user);
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found." });
  }
  return res.render("users/profile", {
    pageTitle: `${user.name}'s Profile`,
    user,
  });
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Not authorized");
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "Change Password" });
};
export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id, password },
    },
    body: { oldPassword, newPassword, newConfirm },
  } = req;
  if (newPassword !== newConfirm) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "Tha password does not math the confirmation",
    });
  }
  const oldPasswordOk = await bcrypt.compare(oldPassword, password);
  if (!oldPasswordOk) {
    return res.render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "Current password doesn't correct.",
    });
  }
  const user = await User.findById(_id);
  user.password = newPassword;
  await user.save();
  req.flash("info", "Password updated");
  // save: hash하기 위함
  return res.redirect("/users/logout");
};
