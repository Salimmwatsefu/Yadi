from django.conf import settings
import qrcode
from io import BytesIO
from django.core.mail import EmailMessage
from django.core.files.storage import default_storage
from PIL import Image, ImageDraw, ImageFont
import os

def create_rounded_rectangle_mask(size, radius):
    """Helper to create a rounded rectangle mask for images"""
    # Supersample 2x for smoother corners
    factor = 2 
    width, height = size
    mask = Image.new('L', (width * factor, height * factor), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, width * factor, height * factor), radius * factor, fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)

def generate_ticket_image(ticket):
    """
    Generates a Dark Mode Ticket Image (PNG) using Pillow.
    Optimized for file size (~400KB).
    """
    # 1. Setup Canvas (Standard Resolution is fine for email)
    width = 800
    # We start with a large height and crop later
    height = 1500 
    
    # Colors (Neon/Dark Theme)
    background_color = (9, 9, 11)  # Zinc-950 (Bg)
    card_color = (24, 24, 27)      # Zinc-900 (Card)
    text_white = (255, 255, 255)
    text_grey = (161, 161, 170)    # Zinc-400
    accent_color = (236, 72, 153)  # Pink-500
    
    img = Image.new('RGB', (width, height), background_color)
    draw = ImageDraw.Draw(img)
    
    # 2. Load Fonts
    try:
        # Try loading a standard font, otherwise fallback
        font_title = ImageFont.truetype("arialbd.ttf", 50)
        font_label = ImageFont.truetype("arial.ttf", 22)
        font_value = ImageFont.truetype("arialbd.ttf", 30)
        font_small = ImageFont.truetype("arial.ttf", 18)
    except IOError:
        font_title = ImageFont.load_default()
        font_label = ImageFont.load_default()
        font_value = ImageFont.load_default()
        font_small = ImageFont.load_default()

    margin = 40
    ticket_width = width - (margin * 2)
    current_y = margin

    # 3. Draw Poster (Rounded Top)
    if ticket.event.poster_image:
        try:
            with default_storage.open(ticket.event.poster_image.name) as f:
                poster = Image.open(f).convert("RGBA")
                
                # Calculate height preserving aspect ratio
                aspect = poster.height / poster.width
                poster_h = int(ticket_width * aspect)
                
                # Cap max height at 600px to keep file size down
                if poster_h > 600:
                    poster_h = 600
                    
                poster = poster.resize((ticket_width, poster_h), Image.Resampling.LANCZOS)
                
                # Create Mask for rounded top corners
                mask = create_rounded_rectangle_mask((ticket_width, poster_h), 30)
                # Flatten bottom corners of mask so it connects to body
                draw_mask = ImageDraw.Draw(mask)
                draw_mask.rectangle((0, 30, ticket_width, poster_h), fill=255)
                
                img.paste(poster, (margin, current_y), mask=mask)
                current_y += poster_h
        except Exception as e:
            print(f"Poster load error: {e}")
            draw.rectangle([margin, current_y, width-margin, current_y+200], fill=(40,40,40))
            current_y += 200
    else:
        current_y += 50

    # 4. Draw Ticket Body Background
    # We draw a rectangle from the bottom of the poster downwards
    body_start_y = current_y
    # Placeholder height, we will crop the image at the end anyway
    draw.rectangle([margin, body_start_y, width-margin, height-margin], fill=card_color)
    
    content_y = body_start_y + 40
    text_x = margin + 40

    # 5. Event Title
    draw.text((text_x, content_y), ticket.event.title, font=font_title, fill=text_white)
    content_y += 80

    # Divider Line
    draw.line([(text_x, content_y), (width - text_x, content_y)], fill=accent_color, width=3)
    content_y += 40

    # 6. Details Rows
    def draw_row(label, value, x, y, color=text_white):
        draw.text((x, y), label, font=font_label, fill=text_grey)
        draw.text((x, y + 35), str(value), font=font_value, fill=color)
        return y + 90

    # Date
    date_str = ticket.event.start_datetime.strftime('%d %b %Y')
    time_str = ticket.event.start_datetime.strftime('%I:%M %p')
    content_y = draw_row("DATE & TIME", f"{date_str} • {time_str}", text_x, content_y)

    # Location
    content_y = draw_row("LOCATION", ticket.event.location_name, text_x, content_y)

    # Ticket & Attendee (Two Columns)
    mid_x = width // 2
    
    # Left Col
    draw.text((text_x, content_y), "TICKET TYPE", font=font_label, fill=text_grey)
    draw.text((text_x, content_y + 35), ticket.tier.name, font=font_value, fill=accent_color)
    
    # Right Col
    draw.text((mid_x, content_y), "ATTENDEE", font=font_label, fill=text_grey)
    attendee = ticket.attendee_name or "Guest"
    # Truncate long names
    if len(attendee) > 20: attendee = attendee[:18] + "..."
    draw.text((mid_x, content_y + 35), attendee, font=font_value, fill=text_white)
    
    content_y += 100

    # 7. QR Code Section
    qr_size = 250
    qr_box_padding = 20
    qr_box_size = qr_size + (qr_box_padding * 2)
    qr_x = (width - qr_box_size) // 2
    
    # White rounded box for QR
    draw.rounded_rectangle(
        (qr_x, content_y, qr_x + qr_box_size, content_y + qr_box_size),
        radius=20,
        fill=(255, 255, 255)
    )

    # Generate QR
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M, # Medium is fine for screen/print
        box_size=10,
        border=0,
    )
    qr.add_data(ticket.qr_code_hash)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").resize((qr_size, qr_size))
    
    img.paste(qr_img, (qr_x + qr_box_padding, content_y + qr_box_padding))
    content_y += qr_box_size + 40

    # 8. Footer ID
    ticket_id = f"ID: {str(ticket.id).split('-')[0].upper()}"
    bbox = draw.textbbox((0, 0), ticket_id, font=font_small)
    text_w = bbox[2] - bbox[0]
    draw.text(((width - text_w) / 2, content_y), ticket_id, font=font_small, fill=text_grey)
    
    content_y += 60 # Bottom padding

    # 9. Final Crop
    final_img = img.crop((0, 0, width, content_y))
    
    # 10. Save Optimised
    buffer = BytesIO()
    # optimize=True drastically reduces PNG size
    final_img.save(buffer, format="PNG", optimize=True) 
    return buffer.getvalue()

def send_ticket_email(ticket):
    """
    Sends email with the generated Ticket Image attached.
    """
    subject = f"Your Ticket: {ticket.event.title} | Yadi Tickets"
    
    try:
        ticket_image_data = generate_ticket_image(ticket)
    except Exception as e:
        print(f"Failed to generate ticket image: {e}")
        ticket_image_data = None

    body = f"""
    Jambo {ticket.attendee_name},
    
    Thank you for purchasing a ticket for {ticket.event.title}.
    
    Please find your official ticket attached to this email.
    You can save this image to your phone and scan it at the gate.
    
    Enjoy the event!
    Yadi Tickets Team
    https://yadi.app
    """

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[ticket.attendee_email or ticket.owner.email],
    )
    
    if ticket_image_data:
        filename = f"Ticket-{ticket.event.title[:10].replace(' ', '_')}-{str(ticket.id)[:4]}.png"
        email.attach(filename, ticket_image_data, 'image/png')
    
    email.send()