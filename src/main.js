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
    rec = `Use an oil-free cleanser, salicylic acid treatment, and lightweight moisturizer.
            
           Product recommendations:
           
           • Oil-Free Cleanser:
            • CeraVe Foaming Facial Cleanser: A classic, gentle, and effective option.
            • La Roche-Posay Effaclar Purifying Foaming Gel Cleanser: Formulated for oily, acne-prone skin.
            • Neutrogena Oil-Free Acne Fighting Facial Cleanser: Contains salicylic acid to fight breakouts.

           • Salicylic Acid Treatment:
            • Paula's Choice 2% BHA Liquid Exfoliant: A cult favorite for exfoliating and unclogging pores.
            • The Ordinary Salicylic Acid 2% Solution: Affordable and effective.
            • COSRX BHA Blackhead Power Liquid: A gentle Korean beauty option.

           • Lightweight Moisturizer:
            • CeraVe AM Facial Moisturizing Lotion with SPF 30: Great for daytime use with sun protection.
            • La Roche-Posay Toleriane Double Repair Matte Moisturizer: For oily, sensitive skin.
            • Neutrogena Hydro Boost Water Gel: A classic lightweight, oil-free option.
          
          Note: These are just recommendations. It is always best to consult with a dermatologist for personalized advice, especially if you have any specific skin concerns.
          
          `;
  } else if (skinType === "dry" && concerns.includes("dullness")) {
    rec = `Use a hydrating cleanser, vitamin C serum, and a rich moisturizer with hyaluronic acid.
    
           Product recommendations:

            • Hydrating Cleanser:
             • CeraVe Hydrating Facial Cleanser: Gentle and contains ceramides to protect the skin barrier.
             • La Roche-Posay Toleriane Hydrating Gentle Cleanser: Fragrance-free and suitable for sensitive skin.
             • Glossier Milky Jelly Cleanser: A creamy, gentle cleanser.
            
            • Vitamin C Serum:
             • Skinceuticals C E Ferulic: A high-end but highly effective option.
             • Mad Hippie Vitamin C Serum: A more affordable and popular choice.
             • Timeless Skin Care Vitamin C + E Ferulic Serum: Another great affordable option.
    
            • Rich Moisturizer with Hyaluronic Acid:
             • CeraVe Moisturizing Cream: A classic for dry skin, contains ceramides and hyaluronic acid.
             • Neutrogena Hydro Boost Extra-Dry Skin Gel-Cream: A richer version of the popular Hydro Boost line.
             • La Roche-Posay Toleriane Double Repair Moisturizer: Rich yet gentle, suitable for sensitive skin.
    
          Note: These are just recommendations. It is always best to consult with a dermatologist for personalized advice, especially if you have any specific skin concerns.
    
          `;
  } else if (skinType === "sensitive") {
    rec = `Opt for gentle, fragrance-free products with soothing ingredients like aloe vera. 
          
           Product recommendations:

            • Cleanser:
             • Vanicream Gentle Facial Cleanser: Specifically formulated for sensitive skin.
             • Cetaphil Gentle Skin Cleanser: A classic for sensitive skin.
             • Aveeno Skin Relief Gentle Foaming Wash: Contains soothing oat extract.
            
            • Serum/Treatment:
             • La Roche-Posay Toleriane Ultra Soothing Serum: Fragrance-free and contains neurosensine to soothe skin.
             • Purito Centella Unscented Serum: Contains centella asiatica, known for its calming properties.

            • Moisturizer:
             • Vanicream Moisturizing Cream: Fragrance-free and suitable for very sensitive skin.
             • Cetaphil Moisturizing Cream: Another classic for sensitive skin.
             • Aveeno Skin Relief Moisturizing Cream: Contains colloidal oatmeal to soothe itchy skin.
    
          Note: These are just recommendations. It is always best to consult with a dermatologist for personalized advice, especially if you have any specific skin concerns.

          `;
  } else {
    rec = "Maintain a balanced routine: cleanse, treat, and moisturize daily. Consult a dermatologist for personalized advice.";
  }

  return rec.replace(/\n/g, '<br>');
}

async function addResultsToDom() {
  document.querySelector('ul').innerHTML = "";
  let response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);

  response.documents.forEach((result) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <p><strong>Description:</strong> ${result.description}</p>
      <p><strong>Recommendation:</strong></p>
      <pre>${result.recommendation}</pre>
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