import './style.css'
import { PROJECT_ID, DATABASE_ID, COLLECTION_ID, BUCKET_ID } from './shhh.js';
import { Client, Databases, Storage, ID } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);

const form = document.getElementById('skinForm');
const resultsList = document.getElementById('results');

form.addEventListener('submit', addResult);

async function addResult(e) {
  e.preventDefault();

  const skinType = document.getElementById('skinType').value;
  const concernElements = document.querySelectorAll('input[name="concerns"]:checked');
  const concerns = Array.from(concernElements).map(el => el.value);

  if (!skinType) {
    alert("Please select your skin type.");
    return;
  }
  if (concerns.length === 0) {
    alert("Please select at least one skin concern.");
    return;
  }

  const description = `Skin Type: ${skinType}. Concerns: ${concerns.join(', ')}.`;

  const recommendation = getRecommendations(skinType, concerns);

  let imageUrl = "";
  let fileId = "";

  const imageFile = document.getElementById('image').files[0];
  if (imageFile) {
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
  }

  try {
    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      { 
        description: description,
        recommendation: recommendation,
        ...(imageUrl ? { image: imageUrl } : {}),
        fileId: fileId
      }
    );
    console.log("Result generated:", result);
    addResultsToDom();
  } catch (error) {
    console.error("Error saving result:", error);
  }
  
  form.reset();
}

function getRecommendations(skinType, concerns) {
  let rec = "";

  if (skinType === "oily" && concerns.includes("acne")) {
    rec = "Use an oil-free cleanser, salicylic acid treatment, and lightweight moisturizer.";
  } else if (skinType === "dry" && concerns.includes("dullness")) {
    rec = "Use a hydrating cleanser, vitamin C serum, and a rich moisturizer with hyaluronic acid.";
  } else if (skinType === "sensitive") {
    rec = "Opt for gentle, fragrance-free products with soothing ingredients like aloe vera.";
  } else {
    rec = "Maintain a balanced routine: cleanse, treat, and moisturize daily. Consult a dermatologist for personalized advice.";
  }

  return rec;
}

async function addResultsToDom() {
  document.querySelector('ul').innerHTML = "";
  let response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);

  response.documents.forEach((result) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <p><strong>Description:</strong> ${result.description}</p>
      <p><strong>Recommendation:</strong> ${result.recommendation}</p>
      ${result.image ? `<img src="${result.image}" alt="Image" style="width: 200px;">` : ""}
      <p>Are you satisfied with these results? <strong>${result.answered === true ? "Yes" : result.answered === false ? "No" : ""}</strong></p>
    `;
    li.id = result.$id;

    const yesBtn = document.createElement('button');
    yesBtn.textContent = '✔️ Yes';
    yesBtn.onclick = () => updateAnswer(result.$id, true);

    const noBtn = document.createElement('button');
    noBtn.textContent = '❌ No';
    noBtn.onclick = () => updateAnswer(result.$id, false);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🧨 Delete';
    deleteBtn.onclick = () => removeResult(result.$id, result.fileId);

    li.appendChild(yesBtn);
    li.appendChild(noBtn);
    li.appendChild(deleteBtn);
    document.querySelector('ul').appendChild(li);
  });
}

async function removeResult(docId, fileId) {
  try {
    if (fileId) {
      await storage.deleteFile(BUCKET_ID, fileId);
      console.log("File deleted:", fileId);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }

  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, docId);
    document.getElementById(docId).remove();
    console.log("Result deleted:", docId);
  } catch (error) {
    console.error("Error deleting result:", error);
  }
}

async function updateAnswer(id, answer) {
  try {
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      id,
      { answered: answer }
    );
    
    const listItem = document.getElementById(id);
    if (listItem) {
      const statusText = listItem.querySelector("p:last-of-type strong");
      if (statusText) {
        statusText.textContent = answer ? "Yes" : "No";
      }
    }
    
    console.log("Answer updated:", updatedDoc);
  } catch (error) {
    console.error("Error updating answer:", error);
  }
}

addResultsToDom();