const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const deleteComment = (event) => {
  const id = event.srcElement.parentNode.dataset.id;
  console.log(id);
};

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const comment = document.createElement("li");
  comment.dataset.id = id;
  comment.classList = "video__comment";
  const textSpan = document.createElement("span");
  textSpan.innerText = text;
  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "❌";
  deleteBtn.classList = "deleteComment";
  deleteBtn.addEventListener("click", deleteComment);
  comment.appendChild(textSpan);
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
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
  }
};

const deleteBtns = document.querySelectorAll(".deleteComment");

if (form) {
  form.addEventListener("submit", handleSubmit);
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", deleteComment);
  });
}
