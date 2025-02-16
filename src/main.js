import './style.css'
import { PROJECT_ID, DATABASE_ID, COLLECTION_ID } from './shhh.js';

import { Client, Databases, ID } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const databases = new Databases(client);

const form = document.querySelector('form')

form.addEventListener('submit', addPost)

function addPost(e){
  e.preventDefault()
  const post = databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    ID.unique(),
    { "description": e.target.description.value,
      // "image":  e.target.image.value,
      "dermatologist-recommendation": e.target.value
     }
  );
  post.then(function (response) {
      addPostsToDom()
  }, function (error) {
      console.log(error);
  });
  form.reset()
}

async function addPostsToDom(){
    document.querySelector('ul').innerHTML = ""
    let response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID
  );
  //console.log(response.documents[0])
  response.documents.forEach((post)=>{
    const li = document.createElement('li')
    li.textContent = `${post['description']} ${post['image']} Has it been answered? ${post['answered']} `

    li.id = post.$id

    const deleteBtn = document.createElement('button')
    deleteBtn.textContent = '🧨'
    deleteBtn.onclick = () => removePost(post.$id)

    const coffeeBtn = document.createElement('button')
    coffeeBtn.textContent = '✔️'
    coffeeBtn.onclick = () => updateAnswer(post.$id)

    li.appendChild(coffeeBtn)
    li.appendChild(deleteBtn)

    document.querySelector('ul').appendChild(li)
  })

  async function removePost(id){
    const result = await databases.deleteDocument(
      DATABASE_ID, // databaseId
      COLLECTION_ID, // collectionId
      id // documentId
    );
    document.getElementById(id).remove()
  
  }
  async function updateAnswer(id){
    const result = databases.updateDocument(
      DATABASE_ID, // databaseId
      COLLECTION_ID, // collectionId
      id, // documentId
      {'answered': true} // data (optional)
        // permissions (optional)
    );
    result.then(function(){location.reload()})
  }

  // promise.then(function (response) {
  //     console.log(response);
  // }, function (error) {
  //     console.log(error);
  // });
}
addPostsToDom()

// const promise = databases.createDocument(
//     DATABASE_ID,
//     COLLECTION_ID,
//     ID.unique(),
//     { "company-name": "100Devs",
//       "date-added": new Date(),
//       "role": "software engineer",
//       "location": "Philly",
//       "position-type": "full time",
//       "source": "https://100devs.org"
//      }
// );

// promise.then(function (response) {
//     console.log(response);
// }, function (error) {
//     console.log(error);
// });

