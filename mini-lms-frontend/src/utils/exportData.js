/**
 * Export data as CSV or PDF
 */

export const exportToCSV = (data, filename = 'export') => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                let val = row[h] ?? '';
                // Escape commas and quotes
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            }).join(',')
        )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export const exportToPDF = (data, title = 'Report', filename = 'export') => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);

    // Build HTML table for print
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
                h1 { font-size: 24px; margin-bottom: 8px; font-weight: 900; letter-spacing: -0.5px; }
                .meta { font-size: 11px; color: #94a3b8; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-weight: 800; 
                     text-transform: uppercase; letter-spacing: 1px; font-size: 10px; color: #64748b;
                     border-bottom: 2px solid #e2e8f0; }
                td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
                tr:hover { background: #f8fafc; }
                .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; 
                          text-transform: uppercase; letter-spacing: 3px; }
                @media print { body { padding: 20px; } }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p class="meta">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Mini LMS</p>
            <table>
                <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
            <p class="footer">Mini LMS • Academic Report</p>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 500);
};
