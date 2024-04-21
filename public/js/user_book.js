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

// get product from database
async function getBook() {
    try {
        const response = await fetch('/user/book');
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

// show book table
function showBook(data, userID) {
    const tbody = document.querySelector('#tbody');
    let temp = '';
    data.forEach(function(book) {
        temp += `<tr>`;
        temp += `<td>${book.book_id}</td>`;
        temp += `<td>${book.Title}</td>`;
        temp += `<td>${book.Author}</td>`;
        temp += `<td><button class="btn btn-success" onclick="book(${book.book_id}, ${userID})">Book</button></td>`;
        temp += `</tr>`;
    });
    tbody.innerHTML = temp;
}

// confirm book function
async function book(bookID, userID) {
    Notiflix.Confirm.show('Confirm', 'Do you want to buy?', 'Yes', 'No', 
        async function okCb() {
            try {
                const response = await fetch(`/user/book/${bookID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userID: userID,
                        bookingDate: new Date().toISOString(), // assuming booking date is the current date
                        returnDate: null, // assuming return date is null initially
                        status: 'pending' // assuming status is initially set to 'pending'
                    })
                });
                if (response.ok) {
                    const data = await response.text();
                    Notiflix.Report.success('Success', data, 'OK', 
                        function cb() {
                            // Reload page
                            getBook();
                            // TODO: Refresh or disable table product detail
                        }
                    );
                } else if (response.status === 500) {
                    const data = await response.text();
                    throw Error(data);
                } else {
                    throw Error('Connection error');
                }
            } catch (err) {
                console.error(err.message);
                Notiflix.Report.failure('Error', err.message, 'Close');
            }
        }
    );
}




// get user info
getUser();
// get and show product
getBook();