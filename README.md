# AI Safety arXiv Trends Dashboard

A dashboard that automatically tracks and visualizes trends in AI research papers from arXiv, with a specific focus on AI Safety papers.

## Features

- Daily tracking of new papers in AI-related categories (cs.AI, cs.LG, cs.CV, cs.CL, cs.RO, stat.ML)
- Identification of papers mentioning AI Safety terms
- Interactive visualization of publication trends by category
- Trending keyword cloud based on paper abstracts
- Searchable paper database with direct links to arXiv
- Filters for categories and keywords
- Automated daily updates via GitHub Actions

## Project Structure

```
arxiv_dashboard/
├── backend/                # Python scripts for data fetching & processing
│   ├── requirements.txt    # Python dependencies
│   ├── update_data.py      # Main data processing script
│   └── copy_data_to_frontend.py  # Helper script to copy data to frontend
├── data/                   # Generated JSON data files
├── frontend/               # Next.js frontend application
│   ├── src/                # Frontend source code
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   └── lib/            # Utility functions and types
│   ├── public/             # Static assets and data files
│   └── package.json        # Frontend dependencies
└── .github/workflows/      # GitHub Actions workflow for automation
```

## Setup and Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Create a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the data update script:
   ```bash
   python update_data.py
   ```

4. Copy data to frontend:
   ```bash
   python copy_data_to_frontend.py
   ```

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `out`

## Data Sources

- Data is fetched from the [arXiv API](https://info.arxiv.org/help/api/index.html)
- The dashboard focuses on the following arXiv categories:
  - cs.AI (Artificial Intelligence)
  - cs.LG (Machine Learning)
  - cs.CV (Computer Vision)
  - cs.CL (Computation and Language)
  - cs.RO (Robotics)
  - stat.ML (Statistics - Machine Learning)

## Technology Stack

- **Backend**:
  - Python (arxiv, nltk, pandas, scikit-learn)
  - Data processing and NLP analysis

- **Frontend**:
  - Next.js
  - React
  - Chart.js (via react-chartjs-2)
  - react-wordcloud
  - Tailwind CSS

- **Automation**:
  - GitHub Actions (daily data updates)

- **Hosting**:
  - Netlify (static site hosting)

## Customization

### AI Safety Keywords

To modify the list of AI Safety-related terms that the dashboard tracks, edit the `SAFETY_TERMS` list in `backend/update_data.py`.

### arXiv Categories

To change which arXiv categories are monitored, edit the `CATEGORIES` list in `backend/update_data.py`.

## Limitations

- The arXiv API has rate limits that restrict how many papers can be fetched at once.
- The dashboard currently only shows papers from the last 7 days.
- NLP analysis is basic (keyword frequency and TF-IDF) rather than using more advanced techniques.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.