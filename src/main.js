import './style.css'
import { PROJECT_ID, DATABASE_ID, COLLECTION_ID, BUCKET_ID } from './shhh.js';
import { Client, Databases, Storage, ID } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);

const form = document.querySelector('form');

form.addEventListener('submit', addPost);

async function addPost(e) {
  e.preventDefault();

  const description = e.target.description.value;
  const imageFile = e.target.image.files[0];

  if (!imageFile) {
    alert("Please upload an image.");
    return;
  }

  let imageUrl = "";
  let fileId = ""

  try {
    const uploadedFile = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      imageFile
    );

    fileId = uploadedFile.$id;
    imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;

    console.log("Image uploaded:", imageUrl);
  } catch (error) {
    console.log("Error uploading image:", error);
    alert("Image upload failed");
    return;
  }

  const post = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    ID.unique(),
    { 
      "description": description,
      "image": imageUrl,
      "fileId": fileId
    }
  );

  console.log("Post created:", post);
  addPostsToDom();
  form.reset();
}

async function addPostsToDom() {
  document.querySelector('ul').innerHTML = "";
  let response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);

  response.documents.forEach((post) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <p>${post['description']}</p>
      <img src="${post.image}" alt="Image" style="width: 200px;">
      <p>Has it been answered? ${post.answered ? post.answered : "No"}</p>
    `;
    li.id = post.$id;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🧨';
    deleteBtn.onclick = () => removePost(post.$id, post.fileId);

    const coffeeBtn = document.createElement('button');
    coffeeBtn.textContent = '✔️';
    coffeeBtn.onclick = () => updateAnswer(post.$id);

    li.appendChild(coffeeBtn);
    li.appendChild(deleteBtn);
    document.querySelector('ul').appendChild(li);
  });

  async function removePost(docId, fileId) {
    try {
      // First, delete the file from Appwrite Storage
      await storage.deleteFile(BUCKET_ID, fileId);
      console.log("File deleted:", fileId);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Optionally alert or handle file deletion error
    }

    try {
      // Then, delete the document from the database
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, docId);
      document.getElementById(docId).remove();
      console.log("Post deleted:", docId);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }

  async function updateAnswer(id) {
    databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      id,
      { 'answered': true }
    ).then(() => {
      location.reload();
    });
  }
}

addPostsToDom();