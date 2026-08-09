import json

def score_prediction(ground_truth_cliff, prediction):
    # ground truth cliff: (33, 41)
    gt_start, gt_end = ground_truth_cliff
    pred_start = prediction.get('start_time', 0)
    pred_end = prediction.get('end_time', 0)

    # Intersection over Union
    intersection = max(0, min(gt_end, pred_end) - max(gt_start, pred_start))
    union = max(gt_end, pred_end) - min(gt_start, pred_start)
    
    iou = intersection / union if union > 0 else 0
    
    gt_center = (gt_start + gt_end) / 2
    pred_center = (pred_start + pred_end) / 2
    localization_error = abs(gt_center - pred_center)
    
    precision = intersection / (pred_end - pred_start) if (pred_end - pred_start) > 0 else 0
    recall = intersection / (gt_end - gt_start) if (gt_end - gt_start) > 0 else 0
    
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    return {
        'iou': iou,
        'localization_error': localization_error,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

if __name__ == '__main__':
    # Simulated prediction from ADK agent
    mock_prediction = {
        'start_time': 32,
        'end_time': 40
    }
    gt = (33, 41)
    
    scores = score_prediction(gt, mock_prediction)
    print("Agent Evaluation Scores:")
    print(json.dumps(scores, indent=2))
