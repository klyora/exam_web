const API_KEY = "1351c78e-5afb-4126-9d17-5925335ee1e6";

let currentPage = 1;
const coursesPerPage = 3;

async function fetchCourses() {
  try {
    const response = await fetch(
      `http://cat-facts-api.std-900.ist.mospolytech.ru/api/courses?api_key=${API_KEY}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }
    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error("Error fetching courses:", error);
  }
}

function renderCourses(courses) {
  const courseList = document.getElementById("course-list");
  courseList.innerHTML = "";

  if (courses.length === 0) {
    courseList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning" role="alert">
                    No courses found.
                </div>
            </div>`;
    return;
  }

  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;

  const paginatedCourses = courses.slice(startIndex, endIndex);

  paginatedCourses.forEach((course) => {
    const card = `
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${course.name}</h5>
                        <p class="card-text">${course.description}</p>
                        <p class="card-text">Teacher: ${course.teacher}</p>
                        <p class="card-text">Level: ${course.level}</p>
                        <p class="card-text">Duration: ${course.totalLength} weeks</p>
                        <button class="btn btn-primary">Apply</button>
                    </div>
                </div>
            </div>`;
    courseList.innerHTML += card;
  });

  renderPagination(courses.length);
}

function renderPagination(totalCourses) {
  const paginationContainer = document.querySelector(".pagination");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalCourses / coursesPerPage);

  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
  prevLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      fetchCourses().then(renderCourses);
    }
  });
  paginationContainer.appendChild(prevLi);

  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageLi.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      fetchCourses().then(renderCourses);
    });
    paginationContainer.appendChild(pageLi);
  }

  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
  nextLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      fetchCourses().then(renderCourses);
    }
  });
  paginationContainer.appendChild(nextLi);
}

fetchCourses().then(renderCourses);