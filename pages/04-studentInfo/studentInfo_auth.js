const profileNameElement = document.getElementById('profileName');
const profileEmailElement = document.getElementById('profileEmail');
const qrCodeDisplayElement = document.getElementById('qr-code-display');

const msalConfig = {
    auth: {
        clientId: "",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "https://stid.ct.ws/pages/02-Dashboard/dashboard.html",
        postLogoutRedirectUri: "https://stid.ct.ws/index.html"
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: true
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

window.onload = function () {    
    const account = msalInstance.getAllAccounts()[0];

    if (!account) {
        const basePath = window.location.pathname.includes("/FNL_Group3") ? "/FNL_Group3" : "";
        window.location.href = `${basePath}/index.html`; 
    } else {

        loadStudentInfo(account);
    }

};

function loadStudentInfo(account) {
    console.log("User is logged in: ", account);



}

function loadStudentInfo(account) {
    if (profileNameElement) {
        profileNameElement.textContent = account.name;
    }

    if(profileEmailElement){
        profileEmailElement.textContent = account.username;
    }

    var studentKey = account.username;
    console.log(studentKey);

    fetch('../../api/fetch_student.php?studentID=' + studentKey)
    .then(response => response.json())
    .then(data => {
        if(qrCodeDisplayElement){
            qrCodeDisplayElement.src = data.student_qr_src;
        }
    })
}

function signOut() {
    sessionStorage.clear();
    
    msalInstance.logoutRedirect({
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
    });
}

document.getElementById('downloadQrBtn').addEventListener('click', function(){  
    const account = msalInstance.getAllAccounts()[0];

    if(qrCodeDisplayElement && qrCodeDisplayElement.src){
        const link = document.createElement('a');
        link.download = `${account.username.split('@')[0]}qr-code.png`;
        link.href = qrCodeDisplayElement.src;
        link.click();
    }
})
