async function fetchTutors() {
  try {
    const response = await fetch(
      `http://cat-facts-api.std-900.ist.mospolytech.ru/api/tutors?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch tutors");
    }
    const tutors = await response.json();
    return tutors;
  } catch (error) {
    console.error("Error fetching tutors:", error);
  }
}

function renderTutors(tutors) {
  const tutorList = document.getElementById("tutor-list");
  tutorList.innerHTML = "";

  if (tutors.length === 0) {
    tutorList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning" role="alert">
                    No tutors found.
                </div>
            </div>`;
    return;
  }

  tutors.forEach((tutor) => {
    const languages = Array.isArray(tutor.languages_offered)
      ? tutor.languages_offered.join(", ")
      : "No languages specified";
    const card = `
      <div class="col-md-4">
          <div class="card">
              <div class="card-body">
                  <h5 class="card-title">${tutor.name}</h5>
                  <p class="card-text">Experience: ${tutor.work_experience} years</p>
                  <p class="card-text">Languages: ${languages}</p>
                  <p class="card-text">Price per hour: ${tutor.price_per_hour} RUB</p>
              </div>
          </div>
      </div>`;
    tutorList.innerHTML += card;
  });
}

fetchTutors().then(renderTutors);