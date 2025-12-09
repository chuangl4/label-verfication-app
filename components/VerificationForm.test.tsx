import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerificationForm from './VerificationForm';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock child components
jest.mock('./ImageUpload', () => {
  return function MockImageUpload({ onImageSelected, disabled }: any) {
    return (
      <div data-testid="image-upload">
        <button
          onClick={() => {
            const mockFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
            onImageSelected([mockFile]);
          }}
          disabled={disabled}
          data-testid="upload-button"
        >
          Upload Image
        </button>
      </div>
    );
  };
});

jest.mock('./MultiImagePreview', () => {
  return function MockMultiImagePreview({ files, onRemove, onAddMore }: any) {
    return (
      <div data-testid="multi-image-preview">
        {files.map((file: File, index: number) => (
          <div key={index} data-testid={`preview-${index}`}>
            {file.name}
            <button onClick={() => onRemove(index)} data-testid={`remove-${index}`}>
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const mockFile = new File(['image2'], 'test2.jpg', { type: 'image/jpeg' });
            onAddMore([mockFile]);
          }}
          data-testid="add-more-button"
        >
          Add More
        </button>
      </div>
    );
  };
});

jest.mock('./FieldError', () => {
  return function MockFieldError({ message }: any) {
    return message ? <div data-testid="field-error">{message}</div> : null;
  };
});

describe('VerificationForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render form with all required fields', () => {
    render(<VerificationForm />);

    expect(screen.getByLabelText(/brand name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ttb product category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/alcohol content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/net contents/i)).toBeInTheDocument();
    expect(screen.getByTestId('image-upload')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify labels/i })).toBeInTheDocument();
  });

  it('should show validation error when submitting without images', async () => {
    const user = userEvent.setup();
    render(<VerificationForm />);

    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(screen.getByText(/please upload at least one label image/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should show validation error when uploading more than 2 images', async () => {
    const user = userEvent.setup();
    render(<VerificationForm />);

    // Upload first image
    await user.click(screen.getByTestId('upload-button'));

    await waitFor(() => {
      expect(screen.getByTestId('multi-image-preview')).toBeInTheDocument();
    });

    // Add second image
    await user.click(screen.getByTestId('add-more-button'));

    // Add third image
    await user.click(screen.getByTestId('add-more-button'));

    // Fill form
    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(screen.getByText(/maximum 2 images allowed/i)).toBeInTheDocument();
    });
  });

  it('should successfully submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      fields: {
        brandName: { matched: true, expected: 'Test Brand', found: 'Test Brand' },
        productType: { matched: true, expected: 'Wine', found: 'Wine' },
        alcoholContent: { matched: true, expected: '13%', found: '13%' },
        netContents: { matched: true, expected: '750 mL', found: '750 mL' },
        governmentWarning: { matched: true, expected: 'GOVERNMENT WARNING present', found: 'GOVERNMENT WARNING found' },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<VerificationForm />);

    // Upload image
    await user.click(screen.getByTestId('upload-button'));

    // Fill form
    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/verify',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/success',
        query: {
          results: JSON.stringify(mockResponse.fields),
        },
      });
    });
  });

  it('should display API errors when verification fails', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: false,
      fields: {
        brandName: {
          matched: false,
          expected: 'Test Brand',
          found: 'Different Brand',
          error: 'Brand name mismatch',
        },
        productType: { matched: true, expected: 'Wine', found: 'Wine' },
        alcoholContent: { matched: true, expected: '13%', found: '13%' },
        netContents: { matched: true, expected: '750 mL', found: '750 mL' },
        governmentWarning: { matched: true, expected: 'GOVERNMENT WARNING present', found: 'GOVERNMENT WARNING found' },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<VerificationForm />);

    // Upload image and fill form
    await user.click(screen.getByTestId('upload-button'));
    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(screen.getByText(/brand name mismatch/i)).toBeInTheDocument();
    });

    // Should not navigate
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle HTTP errors', async () => {
    const user = userEvent.setup();
    const mockErrorResponse = {
      error: 'Server error occurred',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<VerificationForm />);

    await user.click(screen.getByTestId('upload-button'));
    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error occurred/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<VerificationForm />);

    await user.click(screen.getByTestId('upload-button'));
    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('should disable form fields while submitting', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<VerificationForm />);

    await user.click(screen.getByTestId('upload-button'));
    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verifying labels/i })).toBeDisabled();
      expect(screen.getByLabelText(/brand name/i)).toBeDisabled();
    });
  });

  it('should show government warning error separately', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: false,
      fields: {
        brandName: { matched: true, expected: 'Test Brand', found: 'Test Brand' },
        productType: { matched: true, expected: 'Wine', found: 'Wine' },
        alcoholContent: { matched: true, expected: '13%', found: '13%' },
        netContents: { matched: true, expected: '750 mL', found: '750 mL' },
        governmentWarning: {
          matched: false,
          expected: 'GOVERNMENT WARNING present',
          found: null,
          error: 'Government warning statement is missing from the label',
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<VerificationForm />);

    await user.click(screen.getByTestId('upload-button'));
    await user.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await user.selectOptions(screen.getByLabelText(/ttb product category/i), 'Wine');
    await user.type(screen.getByLabelText(/alcohol content/i), '13');
    await user.type(screen.getByLabelText(/net contents/i), '750 mL');

    await user.click(screen.getByRole('button', { name: /verify labels/i }));

    await waitFor(() => {
      expect(screen.getByText(/government warning statement is missing/i)).toBeInTheDocument();
    });
  });

  it('should allow removing uploaded images', async () => {
    const user = userEvent.setup();
    render(<VerificationForm />);

    // Upload image
    await user.click(screen.getByTestId('upload-button'));

    await waitFor(() => {
      expect(screen.getByTestId('multi-image-preview')).toBeInTheDocument();
    });

    // Remove image
    await user.click(screen.getByTestId('remove-0'));

    await waitFor(() => {
      expect(screen.queryByTestId('multi-image-preview')).not.toBeInTheDocument();
      expect(screen.getByTestId('image-upload')).toBeInTheDocument();
    });
  });

  it('should validate alcohol content range', async () => {
    const user = userEvent.setup();
    render(<VerificationForm />);

    const alcoholInput = screen.getByLabelText(/alcohol content/i);

    // Test max validation
    await user.type(alcoholInput, '150');
    await user.tab();

    // The HTML5 validation should prevent values > 100
    // but we can't easily test that with testing-library
    // Instead, we verify the input has the right attributes
    expect(alcoholInput).toHaveAttribute('min', '0');
    expect(alcoholInput).toHaveAttribute('max', '100');
  });

  it('should have required field indicators', () => {
    render(<VerificationForm />);

    const requiredLabels = screen.getAllByText('*');
    expect(requiredLabels.length).toBeGreaterThan(0);
  });
});
