import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { recordError } from './firebase';

export async function uploadAvatar(uid: string, localUri: string): Promise<string> {
  const filename = `avatar_${Date.now()}.jpg`;
  const ref = storage().ref(`avatars/${uid}/${filename}`);

  await ref.putFile(localUri, {
    contentType: 'image/jpeg',
    customMetadata: { uploadedBy: uid },
  });

  const downloadURL = await ref.getDownloadURL();
  return downloadURL;
}

export async function pickAndUploadAvatar(uid: string): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  try {
    return await uploadAvatar(uid, result.assets[0].uri);
  } catch (error) {
    recordError(error as Error, 'pickAndUploadAvatar');
    throw error;
  }
}

export async function uploadJournalImage(
  uid: string,
  entryId: string,
  localUri: string
): Promise<{ url: string; storagePath: string; filename: string }> {
  const filename = `img_${Date.now()}.jpg`;
  const storagePath = `journal/${uid}/${entryId}/${filename}`;
  const ref = storage().ref(storagePath);

  await ref.putFile(localUri, { contentType: 'image/jpeg' });
  const url = await ref.getDownloadURL();

  return { url, storagePath, filename };
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    await storage().ref(storagePath).delete();
  } catch (error) {
    // File may not exist, ignore
    recordError(error as Error, 'deleteFile');
  }
}

export function getUploadProgress(
  ref: ReturnType<typeof storage['prototype']['ref']>,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = ref.putFile(''); // placeholder
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(progress));
      },
      reject,
      () => resolve()
    );
  });
}
