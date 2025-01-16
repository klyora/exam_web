document.addEventListener("DOMContentLoaded", () => {
  fetchTutors().then(renderTutors);
  fetchCourses().then(renderCourses);

  const courseSearchForm = document.getElementById("course-search");
  courseSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const courseName = document
      .getElementById("courseName")
      .value.toLowerCase();
    const courseLevel = document.getElementById("courseLevel").value;

    const courses = await fetchCourses();
    const filteredCourses = courses.filter((course) => {
      const matchesName = course.name.toLowerCase().includes(courseName);
      const matchesLevel =
        courseLevel === "Choose a level..." ||
        course.level.toLowerCase() === courseLevel.toLowerCase();
      return matchesName && matchesLevel;
    });
    renderCourses(filteredCourses);
  });

  const tutorFilterForm = document.getElementById("tutor-filter-form");
  tutorFilterForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const qualification = document.getElementById("tutorQualification").value;
    const experience = parseInt(
      document.getElementById("tutorExperience").value,
      10
    );

    const tutors = await fetchTutors();
    const filteredTutors = tutors.filter((tutor) => {
      const matchesQualification =
        qualification === "Choose a qualification..." ||
        tutor.languages_offered.includes(qualification);
      const matchesExperience =
        isNaN(experience) || tutor.work_experience >= experience;

      return matchesQualification && matchesExperience;
    });

    renderTutors(filteredTutors);
  });

  const menuToggle = document.querySelector(".menu-toggle");
  const navList = document.querySelector("nav ul.nav");

  menuToggle.addEventListener("click", () => {
    navList.classList.toggle("active");
  });
});