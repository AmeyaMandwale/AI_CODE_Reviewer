using DinkToPdf;
using DinkToPdf.Contracts;

namespace GitHubIntegrationBackend.Services
{
    public class PdfService
    {
        private readonly IConverter _converter;

        public PdfService(IConverter converter, IWebHostEnvironment env)
        {
            _converter = converter;
        }

        public byte[] GeneratePdf(string htmlContent)
        {
            var doc = new HtmlToPdfDocument()
            {
                GlobalSettings = new GlobalSettings
                {
                    PaperSize = PaperKind.A4,
                    Orientation = Orientation.Portrait,
                    Margins = new MarginSettings { Top = 15, Bottom = 15 }
                },
                Objects =
                {
                    new ObjectSettings
                    {
                        HtmlContent = htmlContent,
                        WebSettings =
                        {
                            DefaultEncoding = "utf-8",
                            LoadImages = true
                        }
                    }
                }
            };

            return _converter.Convert(doc);
        }
    }
}
