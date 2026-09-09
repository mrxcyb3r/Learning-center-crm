import React, { useState } from 'react';
import { User } from 'lucide-react';

interface TeacherAvatarProps {
  photo?: string | null;
  name?: string;
  gender?: string;
  className?: string;
  imgClassName?: string;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  photo,
  name = "O'qituvchi",
  className = 'w-full h-full',
  imgClassName = 'w-full h-full object-cover',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Consider photo valid if non-empty and hasn't failed to load
  const hasValidPhoto =
    photo &&
    typeof photo === 'string' &&
    photo.trim() !== '' &&
    !photo.includes('unsplash.com') &&
    !imgFailed;

  if (hasValidPhoto) {
    return (
      <img
        src={photo}
        alt={name || "O'qituvchi"}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={imgClassName}
        loading="lazy"
      />
    );
  }

  // Modern clean person/profile icon (Instagram style: subtle neutral container with standard profile silhouette)
  return (
    <div
      className={`${className} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 select-none`}
      title={name || "O'qituvchi"}
    >
      <User className="w-1/2 h-1/2 stroke-[1.75]" />
    </div>
  );
};

