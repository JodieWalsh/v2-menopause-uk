import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  questionId: string;
}

export function MultipleChoiceQuestion({
  question,
  options,
  value,
  onChange,
  questionId,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-medium text-foreground leading-relaxed">
        {question}
      </h3>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {options.map((option, index) => (
          <div 
            key={index} 
            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
              value === option 
                ? 'border-primary bg-primary/5 shadow-soft' 
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <RadioGroupItem 
              value={option} 
              id={`${questionId}-${index}`}
              className="mt-1" 
            />
            <Label 
              htmlFor={`${questionId}-${index}`} 
              className="text-sm leading-relaxed cursor-pointer flex-1 font-medium"
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

interface TextQuestionProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  questionId: string;
}

export function TextQuestion({
  question,
  value,
  onChange,
  placeholder = "Please provide your answer...",
  maxLength = 500,
  questionId,
}: TextQuestionProps) {
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  
  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-medium text-foreground leading-relaxed">
        {question}
      </h3>
      <div className="space-y-2">
        <Textarea
          id={questionId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`min-h-[120px] resize-none transition-all duration-200 ${
            value.length > 0 ? 'border-primary/50' : ''
          }`}
        />
        <div className={`text-right text-sm transition-colors ${
          isNearLimit ? 'text-orange-600' : 'text-muted-foreground'
        }`}>
          {characterCount} / {maxLength} characters
          {isNearLimit && characterCount < maxLength && (
            <span className="ml-2 text-orange-600">• Approaching limit</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface VideoSectionProps {
  videoUrl?: string;
  title?: string;
}

export function VideoSection({ videoUrl, title = "Introduction Video" }: VideoSectionProps) {
  if (!videoUrl) {
    return (
      <div className="mb-8 p-6 bg-muted/30 rounded-lg border-2 border-dashed border-border text-center">
        <p className="text-muted-foreground">Video will be available here</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-foreground mb-4">{title}</h3>
      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
        <video 
          src={videoUrl} 
          controls 
          className="w-full h-full object-cover"
          poster="/placeholder.svg"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}