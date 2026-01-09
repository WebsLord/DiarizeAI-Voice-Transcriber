// src/utils/wordGenerator.js

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ShadingType } from 'docx';

/**
 * Generates a Word (.docx) document base64 string.
 * Word (.docx) belgesi için base64 metni oluşturur.
 */
export const generateWord = async (data, t, theme) => {
    // --- THEME SETTINGS ---
    const isDark = theme === 'dark';
    
    // HEX Renk Kodları (Başında # olmadan)
    // Koyu tema: Beyaz Yazı, Siyah Zemin
    // Açık tema: Siyah Yazı, Beyaz Zemin
    const textColor = isDark ? "FFFFFF" : "000000"; 
    const pageBgColor = isDark ? "000000" : "FFFFFF"; 
    const accentColor = "4A90E2"; // Başlıklar için Mavi

    // PARAGRAF ARKASI DOLGUSU (SHADING)
    // Mobil cihazlar sayfa rengini (Page Color) görmezden geldiği için,
    // Koyu modda her paragrafın arkasını manuel olarak siyaha boyuyoruz.
    // Bu işlem yazının okunabilirliğini garanti eder.
    const shadingConfig = isDark ? {
        fill: "000000",        // Dolgu Rengi (Siyah)
        val: ShadingType.CLEAR, // Desen Tipi (Düz Renk)
        color: "auto"          // Desen Rengi
    } : undefined;

    // --- YARDIMCI FONKSİYONLAR ---

    // 1. Şekilli Yazı Parçası (TextRun)
    const createText = (text, options = {}) => {
        return new TextRun({
            text: text,
            color: textColor,
            font: "Helvetica",
            size: 24, // Word'de 24 = 12pt
            ...options
        });
    };

    // 2. Paragraf Oluşturucu
    // ÖNEMLİ: 'text' parametresi kullanılmıyor, sadece 'children' kullanılıyor.
    // Bu sayede "ÖzetÖzet" gibi çift yazma hatası engelleniyor.
    const createPara = (children, alignment = AlignmentType.LEFT, spacing = { after: 120 }) => {
        return new Paragraph({
            alignment: alignment,
            spacing: spacing,
            shading: shadingConfig, // Arka plan şeridi (Siyah)
            children: children
        });
    };

    // 3. Başlık Oluşturucu (Heading)
    const createHeading = (text) => {
        return new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            spacing: { before: 400, after: 200 },
            shading: shadingConfig, // Arka plan şeridi (Siyah)
            children: [
                new TextRun({
                    text: text,
                    bold: true,
                    color: accentColor,
                    size: 32, // 16pt
                }),
            ],
        });
    };

    // 4. Madde İşareti Oluşturucu (Bullet)
    const createBullet = (text) => {
        return new Paragraph({
            bullet: { level: 0 },
            shading: shadingConfig, // Arka plan şeridi (Siyah)
            children: [createText(text)],
        });
    };

    // --- İÇERİK OLUŞTURMA ---
    const sections = [];

    // --- 1. Başlık (Title) ---
    sections.push(
        new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            shading: shadingConfig,
            children: [
                new TextRun({
                    text: data.originalName || "Audio Analysis",
                    bold: true,
                    color: accentColor,
                    size: 48, // 24pt
                }),
            ],
        })
    );

    // --- 2. Bilgiler (Info) ---
    sections.push(
        createPara([
            createText(`${t('label_language')}: ${data.language || "-"}`, { bold: true })
        ]),
        createPara([
            createText(`${t('label_type')}: ${data.conversation_type || "-"}`, { bold: true })
        ])
    );

    // Boşluk (Spacer) - Koyu modda boşluğun da rengi olmalı ki beyaz çizgi oluşmasın
    sections.push(new Paragraph({ text: "", spacing: { after: 200 }, shading: shadingConfig }));

    // --- 3. Özet (Summary) ---
    sections.push(createHeading(t('label_summary')));
    sections.push(
        createPara([createText(data.summary || "")])
    );

    // --- 4. Anahtar Noktalar (Keypoints) ---
    if (data.keypoints_json || data.keypoints) {
        sections.push(createHeading(t('label_keypoints')));
        let points = [];
        try {
            let src = data.keypoints_json || data.keypoints;
            points = typeof src === 'string' ? JSON.parse(src) : src;
        } catch (e) { points = []; }

        if (Array.isArray(points)) {
            points.forEach(point => {
                sections.push(createBullet(point));
            });
        }
    }

    // --- 5. Transkript (Transcript) ---
    if (data.segments || data.segments_json) {
        sections.push(createHeading(t('label_transcript')));
        
        let segments = [];
        let source = data.segments || data.segments_json;
        try {
            if (Array.isArray(source)) segments = source;
            else if (typeof source === 'string') segments = JSON.parse(source);
        } catch (e) {}

        if (Array.isArray(segments)) {
            segments.forEach(seg => {
                const timeStr = ` [${formatTime(seg.start || seg.start_time)}]`;
                
                // A) Konuşmacı Satırı
                sections.push(
                    new Paragraph({
                        shading: shadingConfig,
                        spacing: { before: 200 },
                        children: [
                            new TextRun({
                                text: (seg.speaker || "Speaker") + timeStr,
                                bold: true,
                                color: accentColor,
                                size: 20, // 10pt
                            }),
                        ],
                    })
                );
                
                // B) Konuşma Metni Satırı
                sections.push(
                    createPara([createText(seg.text)])
                );
            });
        }
    }

    // --- 6. Alt Bilgi (Footer) ---
    sections.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
            shading: shadingConfig,
            children: [
                new TextRun({
                    text: `Generated by DiarizeAI - ${new Date().toLocaleString()}`,
                    italics: true,
                    color: "888888", // Gri renk her iki temada da okunur
                    size: 16, // 8pt
                }),
            ],
        })
    );

    // --- BELGE OLUŞTURMA (Document Generation) ---
    const doc = new Document({
        background: {
            color: pageBgColor, // PC Sürümü için Sayfa Rengi (Tam Siyah)
        },
        sections: [{
            properties: {},
            children: sections,
        }],
    });

    // Base64 Çıktısı
    const buffer = await Packer.toBase64String(doc);
    return buffer;
};

// Yardımcı: Süre Formatlayıcı (00:00)
const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};