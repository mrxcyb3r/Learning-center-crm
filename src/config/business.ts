import { BusinessModel } from '../types/teacher';

const BUSINESS_MODEL_KEY = 'renessans_business_model_v1';

export function getBusinessModel(): BusinessModel {
  try {
    const stored = localStorage.getItem(BUSINESS_MODEL_KEY);
    if (stored && ['learning_center', 'teacher_collected', 'hybrid'].includes(stored)) {
      return stored as BusinessModel;
    }
  } catch {}
  return 'teacher_collected';
}

export function setBusinessModel(model: BusinessModel): void {
  try {
    localStorage.setItem(BUSINESS_MODEL_KEY, model);
  } catch {}
}

export function isIncomeTrackingEnabled(): boolean {
  return getBusinessModel() !== 'learning_center';
}

export function canTeacherRecordPayments(): boolean {
  const model = getBusinessModel();
  return model === 'teacher_collected' || model === 'hybrid';
}
