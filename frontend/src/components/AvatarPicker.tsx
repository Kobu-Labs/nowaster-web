import React, { useState } from 'react';

const IMAGE_PATHS = [
  '/avatars/av1.svg',
  '/avatars/av3.svg',
  '/avatars/av4.svg',
  '/avatars/av5.svg',
  '/avatars/av6.svg',
  '/avatars/av7.svg',
  '/avatars/av8.svg',
  '/avatars/av9.svg',
  '/avatars/av10.svg',
  '/avatars/av12.svg',
  '/avatars/av13.svg',
  '/avatars/av14.svg',
  '/avatars/av15.svg',
  '/avatars/av16.svg'
];

interface AvatarPickerProps {
    onAvatarSelect: (selectedAvatar: string) => void;
  }

const AvatarPicker: React.FC<AvatarPickerProps> = ({ onAvatarSelect }) => {
  const [selectedImage, setSelectedImage] = useState<string>(IMAGE_PATHS[0]);
  const [start, setStart] = useState<number>(0);

  const handleImageSelect = (imagePath: string) => {
    setSelectedImage(imagePath);
    onAvatarSelect(imagePath);
  };

  const handleNextClick = () => {
    setStart((prevStart) => (prevStart < IMAGE_PATHS.length - 3 ? prevStart + 1 : prevStart));
  };

  const handlePrevClick = () => {
    setStart((prevStart) => (prevStart > 0 ? prevStart - 1 : prevStart));
  };

  return (
    <div>
      <label className="text-indigo-500">Pick your avatar:</label> 
      <div className='flex items-center justify-center'>  
        <button className='bg-indigo-500 hover:bg-indigo-600 text-white font-semibold h-12' onClick={handlePrevClick} type='button'>&#60;-</button>
        {IMAGE_PATHS.slice(start, start + 3).map((imagePath, index) => (
          <img
            key={index}
            src={imagePath}
            alt={`Option ${index + 1}`}
            onClick={() => handleImageSelect(imagePath)}
            style={{
              cursor: 'pointer',
              width: '75px',
              height: 'auto',
              margin: '10px',
              outline: selectedImage === imagePath ? '2px solid blue' : 'none',
            }}
          />
        ))}
        <button className='bg-indigo-500 hover:bg-indigo-600 text-white font-semibold h-12' onClick={handleNextClick} type='button'>-&#62;</button>
      </div>
    </div>
  );
};

export default AvatarPicker;
