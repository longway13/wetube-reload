const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const deleteComment = async (event) => {
  const id = event.srcElement.parentElement.dataset.id;
  const comment = event.srcElement.parentNode;
  const response = await fetch(`/api/comments/${id}`, {
    method: "delete",
  });
  comment.remove();
};

const addComment = (text, id, socialOnly, avatarUrl, name) => {
  const videoComments = document.querySelector(".video__comments ul");
  const comment = document.createElement("li");
  comment.dataset.id = id;
  comment.classList = "video__comment";
  const userAvatar = document.createElement("img");
  userAvatar.id = "commentAvatar";
  userAvatar.src = avatarUrl;
  userAvatar.crossOrigin = "anonymous";
  const commentTextBox = document.createElement("div");
  commentTextBox.className = "video__comment-text";
  const commentOwner = document.createElement("span");
  commentOwner.innerText = name;
  const textSpan = document.createElement("span");
  textSpan.innerText = text;
  commentTextBox.appendChild(commentOwner);
  commentTextBox.appendChild(textSpan);
  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "DELETE";
  deleteBtn.classList = "deleteComment";
  deleteBtn.addEventListener("click", deleteComment);

  comment.appendChild(userAvatar);
  comment.appendChild(commentTextBox);
  comment.appendChild(deleteBtn);

  videoComments.prepend(comment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  let text = textarea.value;
  const videoId = videoContainer.dataset.id;

  // request to backend
  if (text === "") {
    return;
  }

  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId, socialOnly, avatarUrl, name } = await response.json();
    addComment(text, newCommentId, socialOnly, avatarUrl, name);
  }
};

const deleteBtns = document.querySelectorAll(".deleteComment");

if (form) {
  form.addEventListener("submit", handleSubmit);
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", deleteComment);
  });
}
