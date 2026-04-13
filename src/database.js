import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js'

// If you enabled Analytics in your project, add the Firebase SDK for Google Analytics
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js'

// Add Firebase products that you want to use
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js'
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc} from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js'



class Database{

    constructor(){
        this.firebaseConfig = {
            apiKey: "AIzaSyAleS36K3zlPAHTQ9_GauE19PC9g7hEL8M",
            authDomain: "particulatedb.firebaseapp.com",
            projectId: "particulatedb",
            storageBucket: "particulatedb.firebasestorage.app",
            messagingSenderId: "473331479001",
            appId: "1:473331479001:web:f1c91f6c656f17290429c8"
        };

        this.app = initializeApp(this.firebaseConfig);
        this.db = getFirestore(this.app);
    }

    async createDoc(collectionName, fieldName1, value1, fieldName2, value2, fieldName3, value3){
        try{
            const docRef = await addDoc(collection(this.db, collectionName), {[fieldName1]: value1, [fieldName2]: value2, [fieldName3]: value3});
            console.log("Document successfully added: ", docRef.id);
            return docRef;
        } catch (error) {
            console.error('Error adding document: ', error);
            return error;
        }
    };

    async readAllDocs(collectionName) {
        try{
            const snapshot  = await getDocs(collection(this.db, collectionName));
            
            const docs = snapshot.docs.map( doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return docs;
        } catch (error){
            console.error('Error reading document', error);
        }
    };

    async findAllWith(collectionName, fieldName, fieldValue){ 
        const q = query(
            collection(this.db, collectionName)
        );

        const querySnapshot = await getDocs(q);

        const docs = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(doc => doc[fieldName].includes(fieldValue));

        return docs;

    }

    async readDocById(collection, id){
        const docRef = doc(this.db, collection, id);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return(docSnap.data());
        } else {
            console.log("No such document!");
            return null
        }
    }

    async updateDoc() {

    };

    async deleteDoc(collectionName, value1) {
        //const result = await deleteDoc(doc(db, collectionName, "document_id"));
    };


}

export { Database };