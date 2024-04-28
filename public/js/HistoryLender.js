// get user
async function getUser() {
    try {
        const response = await fetch('/userInfo');
        if (response.ok) {
            const data = await response.json();
            document.querySelector('#username').textContent = data.username;
        }
        else if (response.status == 500) {
            const data = await response.text();
            throw Error(data);
        }
        else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// get order list from database
async function getBook() {
    try {
        const response = await fetch('/lender/history');
        if (response.ok) {
            const data = await response.json();
            showBook(data);
        }
        else if (response.status == 500) {
            const data = await response.text();
            throw Error(data);
        }
        else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// show product table
function showBook(data) {
    const tbody = document.querySelector('#tbody');
    let temp = '';
    data.forEach(function(book) {
        temp += `<tr>`;
        temp += `<td>${book.booking_id}</td>`;
        temp += `<td>${book.Title}</td>`;
        temp += `<td>${new Date(book.booking_date).toLocaleDateString()}</td>`;
        temp += `<td>${new Date(book.return_date).toLocaleDateString()}</td>`;
        temp += `<td>${book.status}</td>`;
        temp += `</tr>`;
    });
    tbody.innerHTML = temp;
}


// get user info
getUser();

// get and show order
getBook();