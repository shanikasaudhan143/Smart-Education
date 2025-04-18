// src/components/EvaluationTool/LoadingEvaluation.jsx

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CircularProgress } from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TimerIcon from '@mui/icons-material/Timer';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import './LoadingEvaluation.css'; // Import the CSS for animations

// Function to shuffle an array using the Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const LoadingEvaluation = () => {
  // Define the sequence of facts and corresponding icons
  const loadingStepsData = [
    {
      text: "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!",
      icon: <QuizIcon fontSize="large" />,
    },
    {
      text: "Octopuses have three hearts. Two pump blood to the gills, and one pumps it to the rest of the body!",
      icon: <AssignmentTurnedInIcon fontSize="large" />,
    },
    {
      text: "The Eiffel Tower can grow more than six inches taller in the summer due to heat expansion.",
      icon: <AutorenewIcon fontSize="large" />,
    },
    {
      text: "Mount Everest is not the tallest mountain when measured from base to summit—Mauna Kea in Hawaii holds that title!",
      icon: <TimerIcon fontSize="large" />,
    },
    {
      text: "Your body contains about 37.2 trillion cells. That’s more than the number of stars in the Milky Way!",
      icon: <QuizIcon fontSize="large" />,
    },
    {
      text: "Water can boil and freeze at the same time under specific conditions called the 'triple point.'",
      icon: <AssignmentTurnedInIcon fontSize="large" />,
    },
    {
      text: "The heart of a blue whale is so large that a human could swim through its arteries.",
      icon: <AutorenewIcon fontSize="large" />,
    },
    {
      text: "Did you know? The Moon is slowly drifting away from Earth—about 3.8 cm every year!",
      icon: <TimerIcon fontSize="large" />,
    },
    {
      text: "The shortest war in history was between Britain and Zanzibar in 1896—it lasted only 38 minutes!",
      icon: <QuizIcon fontSize="large" />,
    },
    {
      text: "Cats can't taste sweetness. They lack the taste buds for it!",
      icon: <AssignmentTurnedInIcon fontSize="large" />,
    },
    {
      text: "A jellyfish is 95% water and has no brain, heart, or bones.",
      icon: <AutorenewIcon fontSize="large" />,
    },
    {
      text: "A group of flamingos is called a 'flamboyance.'",
      icon: <TimerIcon fontSize="large" />,
    },
    {
      text: "Did you know? The fingerprints of a koala are so similar to humans that they’ve been mistaken at crime scenes!",
      icon: <QuizIcon fontSize="large" />,
    },
    {
      text: "A day on Mercury lasts 1,408 hours—that’s 58 Earth days!",
      icon: <AssignmentTurnedInIcon fontSize="large" />,
    },
    {
      text: "Polar bear fur isn’t white—it’s transparent. It reflects light to appear white!",
      icon: <AutorenewIcon fontSize="large" />,
    },
    {
      text: "The heart of a hummingbird beats over 1,200 times per minute!",
      icon: <TimerIcon fontSize="large" />,
    },
    {
      text: "Ostriches can run faster than horses, reaching speeds up to 60 km/h (37 mph)!",
      icon: <QuizIcon fontSize="large" />,
    },
    {
      text: "The Statue of Liberty’s full name is ‘Liberty Enlightening the World.’",
      icon: <AssignmentTurnedInIcon fontSize="large" />,
    },
    {
      text: "The first email ever sent was by Ray Tomlinson to himself in 1971!",
      icon: <AutorenewIcon fontSize="large" />,
    },
    {
      text: "An ant can lift 50 times its own body weight. That’s like a human lifting a car!",
      icon: <TimerIcon fontSize="large" />,
    },
  ];

  // State to hold the shuffled steps
  const [loadingSteps, setLoadingSteps] = useState([]);

  // State to track the current step index
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Shuffle the loading steps once when the component mounts
    const shuffledSteps = shuffleArray(loadingStepsData);
    setLoadingSteps(shuffledSteps);
  }, []); // Empty dependency array ensures this runs once

  useEffect(() => {
    if (loadingSteps.length === 0) return;

    // Set up an interval to change the current step
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex < loadingSteps.length - 1 ? prevIndex + 1 : 0
      );
    }, 3000); // Change step every 3 seconds

    return () => clearInterval(interval); // Clean up on unmount
  }, [loadingSteps.length]);

  if (loadingSteps.length === 0) {
    // Optional: Render nothing or a fallback while loading
    return null;
  }

  const currentStep = loadingSteps[currentIndex];

  return (
    <Box className="loading-overlay-assign-eva" role="alert" aria-live="assertive">
      <Box className="loading-container-assign-eva">
        <Box className="loading-step-assign-eva active">
          <Box className="loading-icon-assign-eva">
            {currentStep.icon}
          </Box>
          <Typography variant="h6" className="loading-text-assign-eva">
            {currentStep.text}
          </Typography>
        </Box>
        <CircularProgress className="loading-spinner-assign-eva" />
      </Box>
    </Box>
  );
};

export default LoadingEvaluation;
