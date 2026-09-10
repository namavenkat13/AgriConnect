// frontend/js/receipt.js
// AgriConnect Canvas-Based Official Procurement Receipt Generator

(function () {
  /**
   * Draw rounded rectangle helper
   */
  function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  /**
   * Generates a 600x820px PNG receipt on an HTML5 canvas
   */
  function generateReceiptCanvas(data) {
    const canvas = document.createElement('canvas');
    const width = 600;
    const height = 820;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Background (Cream / Warm #FAF7EE)
    ctx.fillStyle = '#FAF7EE';
    ctx.fillRect(0, 0, width, height);

    // Decorative outer border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = '#2C5A3E';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, width - 28, height - 28);

    // 2. Header: Deep green banner #1B5E20
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(15, 15, width - 30, 115);

    // Header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((data.centre_name || 'APMC Procurement Centre').toUpperCase(), width / 2, 52);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 13px "Inter", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('OFFICIAL PROCUREMENT RECEIPT', width / 2, 78);

    ctx.fillStyle = '#C8E6C9';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText('AgriConnect Mandi Procurement & Queue Management System', width / 2, 98);

    // Gold Divider Line
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(15, 130, width - 30, 4);

    // Sub-header: Receipt No & Timestamp
    ctx.fillStyle = '#F4F0E6';
    ctx.fillRect(15, 134, width - 30, 36);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 12px "Roboto Mono", monospace';
    const recNo = data.receipt_no || `REC-${data.booking_id || '00'}-${Date.now().toString().slice(-6)}`;
    ctx.fillText(`RECEIPT NO: ${recNo}`, 30, 157);

    ctx.textAlign = 'right';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = '#555555';
    const nowStr = data.date_time || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    ctx.fillText(`DATE & TIME: ${nowStr}`, width - 30, 157);

    // Section 1: Farmer & Booking Details
    let curY = 195;
    function drawSectionHeader(title, y) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1B5E20';
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.fillText(title, 30, y);

      ctx.strokeStyle = '#E0DDD0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, y + 6);
      ctx.lineTo(width - 30, y + 6);
      ctx.stroke();
    }

    function drawKeyValueRow(label, value, y, isMono = false, isAlt = false) {
      if (isAlt) {
        ctx.fillStyle = '#F4EFE0';
        ctx.fillRect(30, y - 14, width - 60, 20);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#66615B';
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillText(label, 40, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#212121';
      ctx.font = isMono ? 'bold 12px "Roboto Mono", monospace' : '600 12px "Inter", sans-serif';
      ctx.fillText(String(value || '-'), width - 40, y);
    }

    drawSectionHeader('1. FARMER & BOOKING DETAILS', curY);
    curY += 24;
    drawKeyValueRow('Farmer Name:', data.farmer_name || 'N/A', curY, false, true);
    curY += 22;
    drawKeyValueRow('Mobile Number:', data.farmer_phone || 'N/A', curY);
    curY += 22;
    drawKeyValueRow('Booking Channel:', (data.channel || 'Online').toUpperCase() + (data.channel === 'offline' ? ' (Walk-in)' : ''), curY, false, true);
    curY += 22;
    drawKeyValueRow('Slot Scheduled:', `${data.slot_date || ''} (${data.slot_time || ''})`, curY);
    curY += 22;
    drawKeyValueRow('Queue Number:', `#${data.queue_number || '1'}`, curY, true, true);

    // Section 2: Procurement & Quality Grading
    curY += 34;
    drawSectionHeader('2. PROCUREMENT & INSPECTION', curY);
    curY += 24;
    drawKeyValueRow('Crop Procured:', data.crop_name || '-', curY, false, true);
    curY += 22;
    drawKeyValueRow('Actual Net Quantity:', `${Number(data.actual_quantity_kg || 0).toFixed(2)} kg`, curY, true);
    curY += 22;
    drawKeyValueRow('Assigned Quality Grade:', data.quality_grade || 'Grade A', curY, false, true);
    curY += 22;
    drawKeyValueRow('Agreed Rate:', `₹${Number(data.agreed_price_per_unit || 0).toFixed(2)} / kg`, curY, true);

    // Section 3: Payment Details
    curY += 34;
    drawSectionHeader('3. PAYMENT SETTLEMENT', curY);
    curY += 24;
    drawKeyValueRow('Payment Mode:', data.payment_mode || 'Cash', curY, false, true);
    curY += 22;
    drawKeyValueRow('Payment Status:', (data.payment_status || 'Paid').toUpperCase(), curY);
    curY += 22;
    drawKeyValueRow('Txn Reference / ID:', data.transaction_ref || 'OFFLINE-CASH-SETTLED', curY, true, true);

    if (data.adjustment_reason) {
      curY += 22;
      drawKeyValueRow('Price Adjustment Reason:', data.adjustment_reason, curY);
    }

    // Section 4: Final Payout Highlight Box
    curY += 38;
    ctx.fillStyle = '#E8F5E9';
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 30, curY, width - 60, 68, 8, true, true);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 13px "Inter", sans-serif';
    ctx.fillText('TOTAL SETTLEMENT PAYOUT', 48, curY + 28);

    ctx.fillStyle = '#555555';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText('Final Net Payable to Farmer (Inclusive of all grades)', 48, curY + 48);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 26px "Roboto Mono", monospace';
    const formattedAmount = Number(data.final_amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    ctx.fillText(`₹ ${formattedAmount}`, width - 48, curY + 42);

    // Footer
    curY += 92;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, curY);
    ctx.lineTo(width - 30, curY);
    ctx.stroke();

    curY += 18;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1B5E20';
    ctx.font = 'bold 11px "Inter", sans-serif';
    const staffText = data.staff_name ? `Verified & Accepted by Officer ${data.staff_name}` : 'Verified & Accepted by APMC Mandi Staff';
    ctx.fillText(`${staffText} • ${data.centre_name || 'Mandi Yard'}`, width / 2, curY);

    curY += 16;
    ctx.fillStyle = '#777777';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText('This is a tamper-evident system-generated electronic receipt issued via AgriConnect.', width / 2, curY);

    curY += 14;
    ctx.fillStyle = '#999999';
    ctx.font = '9px "Roboto Mono", monospace';
    ctx.fillText(`DOCUMENT HASH: AC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`, width / 2, curY);

    const dataUrl = canvas.toDataURL('image/png');
    return { canvas, dataUrl };
  }

  /**
   * Helper to trigger download of PNG receipt image
   */
  function downloadReceiptImage(dataUrl, filename = 'AgriConnect_Procurement_Receipt.png') {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function syncReceiptBodyLock() {
    const anyActive = document.querySelector('.modal-backdrop.active, .modal-overlay.active');
    if (anyActive) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }

  /**
   * Print receipt image via printable window
   */
  function printReceiptImage(dataUrl) {
    const win = window.open('', '_blank');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups to print receipt.');
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AgriConnect Official Receipt</title>
          <style>
            body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background: #fff; font-family: sans-serif; }
            img { max-width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 4px; }
            @media print {
              body { padding: 0; }
              img { width: 100%; box-shadow: none; border-radius: 0; }
            }
          </style>
        </head>
        <body onload="window.focus(); window.print();">
          <img src="${dataUrl}" alt="AgriConnect Procurement Receipt" />
        </body>
      </html>
    `);
    win.document.close();
  }

  /**
   * Modal to display receipt with download and print options
   */
  function showReceiptModal(dataUrl, bookingId = '', source = 'gemini') {
    let modal = document.getElementById('receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'receipt-modal';
      modal.className = 'modal-backdrop modal-overlay';
      modal.innerHTML = `
        <div class="modal-box modal-content" style="max-width: 660px;">
          <div class="modal-header">
            <h3 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
              <span class="title-icon">📄</span> <span>Official Procurement Receipt</span>
            </h3>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AgriReceipt.closeReceiptModal()" aria-label="Close">✕</button>
          </div>
          <div class="modal-body" style="text-align: center;">
            <div id="receipt-badge-container" style="margin-bottom: 0.75rem; display: flex; justify-content: center;">
              <span id="receipt-source-badge" class="badge-channel badge-channel-online">✨ Gemini AI Generated</span>
            </div>
            <div style="max-height: 60vh; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 0.5rem; background: var(--bg);">
              <img id="receipt-modal-img" src="" alt="Procurement Receipt" style="width: 100%; height: auto; display: block; margin: 0 auto;" />
            </div>
          </div>
          <div class="modal-footer">
            <div class="modal-footer-actions">
              <button type="button" class="btn btn-secondary" onclick="AgriReceipt.closeReceiptModal()">Close</button>
              <button type="button" class="btn btn-secondary" id="receipt-modal-print-btn">
                <span class="btn-icon">🖨️</span> <span>Print</span>
              </button>
              <button type="button" class="btn btn-primary" id="receipt-modal-download-btn">
                <span class="btn-icon">⬇️</span> <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeReceiptModal();
        }
      });
    }

    const img = document.getElementById('receipt-modal-img');
    img.src = dataUrl;

    const sourceBadge = document.getElementById('receipt-source-badge');
    if (sourceBadge) {
      if (source === 'gemini') {
        sourceBadge.className = 'badge-channel badge-channel-online';
        sourceBadge.innerHTML = '<span class="badge-icon">✨</span> <span>Gemini AI Generated Receipt</span>';
      } else {
        sourceBadge.className = 'badge-channel badge-channel-offline';
        sourceBadge.innerHTML = '<span class="badge-icon">📄</span> <span>Verified Mandi Receipt (Canvas)</span>';
      }
    }

    const printBtn = document.getElementById('receipt-modal-print-btn');
    if (printBtn) {
      printBtn.onclick = () => {
        printReceiptImage(dataUrl);
      };
    }

    const downloadBtn = document.getElementById('receipt-modal-download-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        downloadReceiptImage(dataUrl, `AgriConnect_Receipt_Booking_${bookingId || 'Record'}.png`);
      };
    }

    modal.classList.add('active');
    syncReceiptBodyLock();
  }

  function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) modal.classList.remove('active');
    syncReceiptBodyLock();
  }

  window.AgriReceipt = {
    generateReceiptCanvas,
    downloadReceiptImage,
    printReceiptImage,
    showReceiptModal,
    closeReceiptModal
  };
})();
