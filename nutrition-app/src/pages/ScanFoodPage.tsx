import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, ScanLine } from 'lucide-react';
import { foodRecognitionService } from '@/services/FoodRecognitionService';
import { useAppStore } from '@/store/useAppStore';
import { useAddContext } from '@/hooks/useAddContext';
import { suggestMealType, MEAL_LABELS } from '@/utils/mealTime';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScanAnimation } from '@/components/food/ScanAnimation';
import { calculateNutrition } from '@/utils/nutritionCalculator';
import { findFoodById } from '@/data/foods';
import type { MealType, ScanResult, ScannedFoodCandidate } from '@/types';

type ScanStage = 'capture' | 'analyzing' | 'review' | 'error';

const CONFIDENCE_LABEL: Record<ScannedFoodCandidate['confidence'], { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-primary-50 text-primary-700' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700' },
  low: { label: 'Low', className: 'bg-orange-50 text-orange-700' },
};

export function ScanFoodPage() {
  const { date, meal: mealFromUrl, queryString } = useAddContext();
  const navigate = useNavigate();
  const addDiaryEntry = useAppStore((s) => s.addDiaryEntry);
  const touchRecent = useAppStore((s) => s.touchRecent);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<ScanStage>('capture');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [candidates, setCandidates] = useState<ScannedFoodCandidate[]>([]);
  const [mealType, setMealType] = useState<MealType>(mealFromUrl ?? suggestMealType());

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageDataUrl(dataUrl);
      runRecognition(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function runRecognition(dataUrl: string) {
    setStage('analyzing');
    try {
      const result = await foodRecognitionService.recognize(dataUrl);
      if (result.candidates.length === 0) {
        setStage('error');
        return;
      }
      setScan(result);
      setCandidates(result.candidates);
      setStage('review');
    } catch {
      setStage('error');
    }
  }

  function updateCandidateGrams(id: string, grams: number) {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const food = findFoodById(c.foodId);
        return food ? { ...c, estimatedGrams: grams, nutrition: calculateNutrition(food.per100g, grams) } : c;
      }),
    );
  }

  function removeCandidate(id: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }

  function retake() {
    setStage('capture');
    setImageDataUrl(null);
    setScan(null);
    setCandidates([]);
  }

  function confirmAdd() {
    for (const c of candidates) {
      addDiaryEntry({
        date,
        mealType,
        foodId: c.foodId,
        foodName: c.name,
        foodImageEmoji: findFoodById(c.foodId)?.imageEmoji,
        quantityGrams: c.estimatedGrams,
        servingLabel: `${c.estimatedGrams}g (estimated)`,
        nutrition: c.nutrition,
        dataQuality: 'ai_estimate',
        source: 'scan',
        aiConfidence: c.confidence,
      });
      touchRecent({ refId: c.foodId, refType: 'food' });
    }
    navigate(date && date !== undefined ? `/diary?date=${date}` : '/');
  }

  return (
    <div className="space-y-5 pb-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Scan Food</h1>
        <p className="mt-1 text-sm text-muted">Take a photo and let AI estimate the nutrition.</p>
      </header>

      {stage === 'capture' && (
        <div className="flex flex-col items-center gap-5 rounded-xl2 bg-white p-8 text-center shadow-card">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <ScanLine size={34} />
          </div>
          <div>
            <p className="font-semibold text-ink">Photograph your meal</p>
            <p className="mt-1 max-w-xs text-sm text-muted">Center the food in frame with good lighting for the best estimate.</p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:flex-row">
            <Button fullWidth size="lg" icon={<Camera size={18} />} onClick={() => cameraInputRef.current?.click()}>
              Open Camera
            </Button>
            <Button fullWidth size="lg" variant="secondary" icon={<ImagePlus size={18} />} onClick={() => fileInputRef.current?.click()}>
              Upload Photo
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      )}

      {stage === 'analyzing' && imageDataUrl && (
        <div className="overflow-hidden rounded-xl2 bg-white shadow-card">
          <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
            <img src={imageDataUrl} alt="Captured food" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/35" />
            <ScanAnimation />
          </div>
        </div>
      )}

      {stage === 'error' && (
        <ErrorState
          title="AI couldn't recognize any food"
          description="Try a clearer, well-lit photo, or search for the food manually instead."
          onRetry={retake}
        />
      )}

      {stage === 'review' && scan && (
        <div className="space-y-5">
          {imageDataUrl && (
            <div className="overflow-hidden rounded-xl2 shadow-card">
              <img src={imageDataUrl} alt="Captured food" className="aspect-video w-full object-cover" />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <span>⚠️ AI estimate — review and adjust before adding.</span>
            <button onClick={retake} className="flex items-center gap-1 font-semibold underline underline-offset-2">
              <RotateCcw size={13} /> Retake
            </button>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Meal</p>
            <div className="flex flex-wrap gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map((mt) => (
                <Chip key={mt} selected={mealType === mt} onClick={() => setMealType(mt)}>
                  <span className="mr-1">{MEAL_LABELS[mt].emoji}</span>
                  {MEAL_LABELS[mt].label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {candidates.map((c) => (
              <div key={c.id} className="rounded-xl2 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-muted">Estimated: ~{Math.round(c.nutrition.calories)} kcal</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_LABEL[c.confidence].className}`}>
                      Confidence: {CONFIDENCE_LABEL[c.confidence].label}
                    </span>
                    <button onClick={() => removeCandidate(c.id)} className="text-xs font-medium text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center rounded-xl bg-gray-50 py-3">
                  <QuantityStepper value={c.estimatedGrams} onChange={(g) => updateCandidateGrams(c.id, g)} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted">
                  <span>
                    <b className="text-protein">{Math.round(c.nutrition.proteinG)}g</b> protein
                  </span>
                  <span>
                    <b className="text-carbs">{Math.round(c.nutrition.carbsG)}g</b> carbs
                  </span>
                  <span>
                    <b className="text-fat">{Math.round(c.nutrition.fatG)}g</b> fat
                  </span>
                </div>
              </div>
            ))}
          </div>

          {candidates.length === 0 ? (
            <ErrorState title="No items left" description="You removed every detected item — retake or search manually." onRetry={retake} />
          ) : (
            <Button fullWidth size="lg" onClick={confirmAdd}>
              Add {candidates.length} item{candidates.length > 1 ? 's' : ''} to {MEAL_LABELS[mealType].label}
            </Button>
          )}
        </div>
      )}

      {/* keep query context available if user backs out */}
      <div className="hidden">{queryString}</div>
    </div>
  );
}
