# CBC Blood Test Interpretation Platform

This project is a web-based platform for interpreting Complete Blood Count (CBC) test results. The platform allows users to upload their CBC test reports in PDF, image (PNG, JPEG), or DOCX formats, and provides detailed medical explanations of the results, including clinical significance, recommendations, and monitoring. The platform supports both Arabic and English languages.

## Features

- **Multilingual Support**: Users can choose between Arabic and English for test result interpretations.
- **File Upload**: Supports PDF, image (PNG, JPEG), and DOCX formats for CBC reports.
- **Detailed Interpretations**: The platform provides:
  - Clinical significance for each blood test parameter.
  - Medical recommendations based on the results.
  - Monitoring advice for tracking health over time.
  - General diagnosis based on the test results.
- **Responsive Design**: The platform is designed to be fully responsive, ensuring a seamless experience on both desktop and mobile devices.

## Technologies Used

- **Backend**: 
  - Node.js with Express framework
  - OpenAI API (GPT-4) for generating medical interpretations
  - Multer for handling file uploads
  - Tesseract.js for extracting text from images (OCR)
  - pdf-parse for extracting text from PDF files
- **Frontend**:
  - HTML5, CSS3 (Bootstrap 4), and JavaScript (jQuery) for the user interface
  - Responsive design for mobile and desktop users
- **Languages**: Supports both Arabic and English for user interaction and result interpretation.

## How to Run Locally

1. **Install dependencies**:
    Ensure you have [Node.js](https://nodejs.org/) installed, then run:
    ```bash
    npm install
    ```

2. **Set up OpenAI API Key**:
    - Create a `.env` file in the project root directory and add your OpenAI API key:
    ```bash
    OPENAI_API_KEY=your-openai-api-key
    ```

3. **Start the server**:
    ```bash
    node app.js
    ```

4. **Access the platform**:
    Open your browser and go to `http://localhost:3000`.

## Usage

1. **Select Language**: Choose between Arabic and English using the language selector at the top of the page.
2. **Upload CBC Report**: Upload your CBC report in PDF, PNG, JPEG, or DOCX format.
3. **Enter Details**: Provide your age and gender for accurate interpretation.
4. **Submit**: Click the "Upload" button to get a detailed interpretation of your CBC results, including clinical significance, recommendations, and monitoring.

## Future Enhancements

- Add more detailed interpretations for specific blood test parameters.
- Include support for additional file formats.
- Improve UI/UX for better user experience.
- Provide more personalized recommendations based on the user's medical history.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for review.
