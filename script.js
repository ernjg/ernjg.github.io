// Define a dictionary of project information
const projects = {
  project1: {
    title: "Project 1",
    description: "This is a description of Project 1.",
  },
  // Add more projects here
    
     project2: {
    title: "Project 2",
    description: "This is a description of Project 2.",
  },
    
     project3: {
    title: "Project 3",
    description: "This is a description of Project 3.",
  },
    
      project4: {
    title: "Project 4",
    description: "This is a description of Project 4.",
  },
    
      project5: {
    title: "Project 5",
    description: "This is a description of Project 5.",
  },
    
    
    
    
};

function showDetails(projectId) {
  const modal = document.getElementById("myModal");
  const title = document.getElementById("modalTitle");
  const description = document.getElementById("modalDescription");

  title.textContent = projects[projectId].title;
  description.textContent = projects[projectId].description;

  modal.style.display = "block";

  const close = document.querySelector(".close");
  close.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}



