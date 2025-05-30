window.onload = function (){
    const form = document.getElementById("changePasswordForm");

    form.addEventListener('submit', function(event){
        event.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        console.log(data);

        fetch(`changePassword.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": data.username,
                "oldPassword": data.oldPassword,
                "newPassword": data.newPassword
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            if (result.status == 1) {
                alert("Password changed!");
            } else if (result.status == 2) {
                alert("Username or password might be incorrect!");
            } else {
                alert("System error >:(");
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            alert("Network or server error.");
        });
    });

}