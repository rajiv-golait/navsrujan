"""Train ML models and save to backend/model/"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.ml.train import train_from_dataset, save_models

def main():
    print("Training ML models...")
    print("=" * 50)
    
    dataset_dir = backend_dir.parent / "dataset"
    model_dir = backend_dir / "model"
    output_file = model_dir / "student_financial_intelligence_models.pkl"
    
    if not dataset_dir.exists():
        print(f"Error: Dataset directory not found at {dataset_dir}")
        print(f"Looking for: {dataset_dir}")
        return 1
    
    print(f"Dataset directory: {dataset_dir}")
    print(f"Model output: {output_file}")
    
    # Create model directory if it doesn't exist
    model_dir.mkdir(exist_ok=True)
    
    try:
        print("\n1. Training models from dataset...")
        bundle = train_from_dataset(dataset_dir)
        
        print(f"\n2. Saving bundle...")
        saved_path = save_models(bundle, output_file)
        
        print("\nTraining complete!")
        print(f"Models included: {list(bundle.keys())}")
        print(f"Training rows: {bundle.get('training_rows', 'N/A')}")
        print(f"Training users: {bundle.get('training_users', 'N/A')}")
        print(f"Saved to: {saved_path}")
        return 0
    except Exception as e:
        print(f"\nTraining failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
